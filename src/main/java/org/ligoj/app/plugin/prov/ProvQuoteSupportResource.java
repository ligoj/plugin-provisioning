/*
 * Licensed under MIT (https://github.com/ligoj/ligoj/blob/master/LICENSE)
 */

package org.ligoj.app.plugin.prov;

import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.transaction.Transactional;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;

import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.ligoj.app.plugin.prov.dao.ProvQuoteSupportRepository;
import org.ligoj.app.plugin.prov.dao.ProvSupportPriceRepository;
import org.ligoj.app.plugin.prov.dao.ProvSupportTypeRepository;
import org.ligoj.app.plugin.prov.model.Costed;
import org.ligoj.app.plugin.prov.model.ProvInstancePrice;
import org.ligoj.app.plugin.prov.model.ProvQuote;
import org.ligoj.app.plugin.prov.model.ProvQuoteSupport;
import org.ligoj.app.plugin.prov.model.ProvSupportPrice;
import org.ligoj.app.plugin.prov.model.ProvSupportType;
import org.ligoj.app.plugin.prov.model.ResourceType;
import org.ligoj.app.plugin.prov.model.SupportType;
import org.ligoj.bootstrap.core.DescribedBean;
import org.ligoj.bootstrap.core.json.TableItem;
import org.ligoj.bootstrap.core.json.datatable.DataTableAttributes;
import org.ligoj.bootstrap.core.validation.ValidationJsonException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * The support plan part of the provisioning.
 */
@Service
@Path(ProvResource.SERVICE_URL)
@Produces(MediaType.APPLICATION_JSON)
@Transactional
public class ProvQuoteSupportResource
		extends AbstractCostedResource<ProvSupportType, ProvSupportPrice, ProvQuoteSupport> {

	@Autowired
	private ProvSupportTypeRepository stRepository;

	@Autowired
	private ProvSupportPriceRepository spRepository;

	@Autowired
	private ProvQuoteSupportRepository qsRepository;

	/**
	 * Delete all supports from a quote. The total cost is updated.
	 *
	 * @param subscription
	 *            The related subscription.
	 * @return The updated computed cost.
	 */
	@DELETE
	@Path("{subscription:\\d+}/support")
	@Consumes(MediaType.APPLICATION_JSON)
	public UpdatedCost deleteAll(@PathParam("subscription") final int subscription) {
		final ProvQuote quote = resource.getQuoteFromSubscription(subscription);
		final UpdatedCost cost = new UpdatedCost(0);
		cost.getDeleted().put(ResourceType.SUPPORT, qsRepository.findAllIdentifiers(subscription));

		// Delete all storages related to any instance, then the instances
		qsRepository.deleteAll(qsRepository.findAllBy("configuration.subscription.id", subscription));

		// Update the cost. Note the effort could be reduced to a simple
		// subtract of storage costs.
		return resource.refreshSupportCost(cost, quote);
	}

	/**
	 * Create the support plan inside a quote.
	 *
	 * @param vo
	 *            The quote support details.
	 * @return The created instance cost details with identifier.
	 */
	@POST
	@Path("support")
	@Consumes(MediaType.APPLICATION_JSON)
	public UpdatedCost create(final QuoteSupportEditionVo vo) {
		return saveOrUpdate(new ProvQuoteSupport(), vo);
	}

	/**
	 * Update the support plan inside a quote.
	 *
	 * @param vo
	 *            The quote storage update.
	 * @return The new cost configuration.
	 */
	@PUT
	@Path("support")
	@Consumes(MediaType.APPLICATION_JSON)
	public UpdatedCost update(final QuoteSupportEditionVo vo) {
		return saveOrUpdate(resource.findConfigured(qsRepository, vo.getId()), vo);
	}

	@Override
	public FloatingCost refresh(final ProvQuoteSupport qs) {
		final ProvQuote quote = qs.getConfiguration();

		// Find the lowest price
		qs.setPrice(validateLookup("support-plan",
				lookup(quote, qs.getSeats(), qs.getAccessApi(), qs.getAccessEmail(), qs.getAccessChat(),
						qs.getAccessPhone(), qs.isGeneralGuidance(), qs.isContextualGuidance(), qs.isContextualReview())
								.stream().findFirst().orElse(null),
				qs.getName()));
		return updateCost(qs).round();
	}

	/**
	 * Check and return the storage price matching to the requirements and related name.
	 */
	private ProvSupportPrice findByTypeName(final int subscription, final String name) {
		return assertFound(spRepository.findByTypeName(subscription, name), name);
	}

	/**
	 * Save or update the support inside a quote.
	 *
	 * @param entity
	 *            The support entity to update.
	 * @param vo
	 *            The new quote support data to persist.
	 * @return The formal entity.
	 */
	private UpdatedCost saveOrUpdate(final ProvQuoteSupport entity, final QuoteSupportEditionVo vo) {
		DescribedBean.copy(vo, entity);

		// Check the associations
		final int subscription = vo.getSubscription();
		final ProvQuote quote = getQuoteFromSubscription(subscription);
		entity.setConfiguration(quote);
		entity.setPrice(findByTypeName(subscription, vo.getType()));
		entity.setSeats(vo.getSeats());
		entity.setAccessApi(vo.getAccessApi());
		entity.setAccessEmail(vo.getAccessEmail());
		entity.setAccessChat(vo.getAccessChat());
		entity.setAccessPhone(vo.getAccessPhone());
		entity.setName(vo.getName());
		entity.setDescription(vo.getDescription());
		entity.setGeneralGuidance(vo.isGeneralGuidance());
		entity.setContextualGuidance(vo.isContextualGuidance());
		entity.setContextualReview(vo.isContextualReview());

		// Check the support requirements to validate the linked price
		final ProvSupportType type = entity.getPrice().getType();
		if (lookup(quote, vo.getSeats(), vo.getAccessApi(), vo.getAccessEmail(), vo.getAccessChat(),
				vo.getAccessPhone(), vo.isGeneralGuidance(), vo.isContextualGuidance(), vo.isContextualReview())
						.stream().map(qs -> qs.getPrice().getType()).noneMatch(type::equals)) {
			// The related storage type does not match these requirements
			throw new ValidationJsonException("type", "type-incompatible-requirements", type.getName());
		}

		// Save and update the costs
		return newUpdateCost(entity);
	}

	/**
	 * Request a cost update of the given entity and report the delta to the the global cost. The changes are persisted.
	 *
	 * @param entity
	 *            The quote instance to update.
	 * @return The new computed cost.
	 */
	protected UpdatedCost newUpdateCost(final ProvQuoteSupport entity) {
		return newUpdateCost(qsRepository, entity, this::updateCost);
	}

	@Override
	public <T extends Costed> void addCost(final T entity, final double oldCost, final double oldMaxCost) {
		// Report the delta to the quote
		final ProvQuote quote = entity.getConfiguration();
		quote.setCost(round(quote.getCost() + entity.getCost() - oldCost));
		quote.setMaxCost(round(quote.getMaxCost() + entity.getMaxCost() - oldMaxCost));
	}

	/**
	 * Delete a storage from a quote. The total cost is updated.
	 *
	 * @param id
	 *            The {@link ProvQuoteSupport}'s identifier to delete.
	 * @return The updated computed cost.
	 */
	@DELETE
	@Path("support/{id:\\d+}")
	@Consumes(MediaType.APPLICATION_JSON)
	public UpdatedCost delete(@PathParam("id") final int id) {
		return resource.refreshSupportCost(new UpdatedCost(id),
				deleteAndUpdateCost(qsRepository, id, Function.identity()::apply));
	}

	/**
	 * Return the storage types the instance inside a quote.
	 *
	 * @param subscription
	 *            The subscription identifier, will be used to filter the storages from the associated provider.
	 * @param uriInfo
	 *            filter data.
	 * @return The valid storage types for the given subscription.
	 */
	@GET
	@Path("{subscription:\\d+}/support-type")
	@Consumes(MediaType.APPLICATION_JSON)
	public TableItem<ProvSupportType> findType(@PathParam("subscription") final int subscription,
			@Context final UriInfo uriInfo) {
		subscriptionResource.checkVisible(subscription);
		return paginationJson.applyPagination(uriInfo,
				stRepository.findAll(subscription, DataTableAttributes.getSearch(uriInfo),
						paginationJson.getPageRequest(uriInfo, ProvResource.ORM_COLUMNS)),
				Function.identity());
	}

	/**
	 * Return the available storage types from the provider linked to the given subscription..
	 *
	 * @param subscription
	 *            The subscription identifier, will be used to filter the storage types from the associated provider.
	 * @param seats
	 *            Who can open cases. When <code>null</code>, unlimited requirement.
	 * @param accessApi
	 *            API access. <code>null</code> when is not required.
	 * @param accessChat
	 *            Chat access. <code>null</code> when is not required.
	 * @param accessPhone
	 *            Phone access. <code>null</code> when is not required.
	 * @param generalGuidance
	 *            General guidance.
	 * @param contextualGuidance
	 *            Contextual guidance based on your use-case.
	 * @param contextualReview
	 *            Consultative review and guidance based on your applications.
	 * @return The valid support types for the given subscription.
	 */
	@GET
	@Path("{subscription:\\d+}/support-lookup")
	@Consumes(MediaType.APPLICATION_JSON)
	public List<QuoteSupportLookup> lookup(@PathParam("subscription") final int subscription,
			@QueryParam("seats") final Integer seats, @QueryParam("access-api") final SupportType accessApi,
			@QueryParam("access-email") final SupportType accessEmail,
			@QueryParam("access-chat") final SupportType accessChat,
			@QueryParam("access-phone") final SupportType accessPhone,
			@DefaultValue("false") @QueryParam("general-guidance") final boolean generalGuidance,
			@DefaultValue("false") @QueryParam("contextual-guidance") final boolean contextualGuidance,
			@DefaultValue("false") @QueryParam("contextual-review") final boolean contextualReview) {

		// Check the security on this subscription
		return lookup(getQuoteFromSubscription(subscription), seats, accessApi, accessEmail, accessChat, accessPhone,
				generalGuidance, contextualGuidance, contextualReview);
	}

	/**
	 * Related support type name within the given location.
	 */
	@NotNull
	private String type;

	private List<QuoteSupportLookup> lookup(final ProvQuote quote, final Integer seats, final SupportType accessApi,
			final SupportType accessEmail, final SupportType accessChat, final SupportType accessPhone,
			final boolean generalGuidance, final boolean contextualGuidance, final boolean contextualReview) {

		// Get the attached node and check the security on this subscription
		final String node = quote.getSubscription().getNode().getRefined().getId();
		return spRepository.findAll(node).stream().filter(sp -> sp.getType().getSeats() == null || seats != null)
				.filter(sp -> compare(accessApi, sp.getType().getAccessApi()))
				.filter(sp -> compare(accessChat, sp.getType().getAccessChat()))
				.filter(sp -> compare(accessEmail, sp.getType().getAccessEmail()))
				.filter(sp -> compare(accessPhone, sp.getType().getAccessPhone()))
				.filter(sp -> compare(generalGuidance, sp.getType().isGeneralGuidance()))
				.filter(sp -> compare(contextualGuidance, sp.getType().isContextualGuidance()))
				.filter(sp -> compare(contextualReview, sp.getType().isContextualReview()))
				.map(sp -> newPrice(quote, sp, seats)).sorted((p1, p2) -> (int) (p1.getCost() - p2.getCost()))
				.collect(Collectors.toList());
	}

	private boolean compare(final SupportType quote, final SupportType provided) {
		return quote == null || provided == SupportType.ALL || quote == provided;
	}

	private boolean compare(final boolean quote, final boolean provided) {
		return provided || !quote;
	}

	/**
	 * Build a new {@link QuoteInstanceLookup} from {@link ProvInstancePrice} and computed price.
	 */
	private QuoteSupportLookup newPrice(final ProvQuote quote, final ProvSupportPrice price, final Integer seats) {
		final QuoteSupportLookup result = new QuoteSupportLookup();
		final int[] rates = toIntArray(price.getRate());
		final int[] limits = toIntArray(price.getLimit());
		result.setCost(round(getCost(seats, quote.getCostNoSupport(), price, rates, limits)));
		result.setPrice(price);
		result.setSeats(seats);
		return result;
	}

	@Override
	public FloatingCost getCost(final ProvQuoteSupport entity) {
		final ProvQuote quote = entity.getConfiguration();
		final ProvSupportPrice price = entity.getPrice();
		final int[] rates = toIntArray(price.getRate());
		final int[] limits = toIntArray(price.getLimit());
		final Integer seats = entity.getSeats();
		return new FloatingCost(getCost(seats, quote.getCostNoSupport(), price, rates, limits),
				getCost(seats, quote.getMaxCostNoSupport(), price, rates, limits), quote.isUnboundCost()).round();
	}

	private int[] toIntArray(String rawString) {
		return Arrays.stream(StringUtils.split(ObjectUtils.defaultIfNull(rawString, ""), ","))
				.mapToInt(Integer::parseInt).toArray();
	}

	private Double getCost(final Integer seats, final double cost, final ProvSupportPrice price, final int[] rates,
			final int[] limits) {
		// Compute the group of required seats
		final int nb = Math.max(1,
				price.getType().getSeats() == null ? 1 : (int) Math.ceil((double) seats / price.getType().getSeats()));
		// Compute the cost of the seats and the rates
		return nb * (computeRates(cost, price.getMin(), rates, limits) + price.getCost());
	}

	/**
	 * Apply successive rates following this computation:<br>
	 * <p>
	 * <code>
	   Math.max(plan.getMin();<br>
	   Math.max(0;Math.min(cost;limit3)-limit2)*rate3 +<br>
	   Math.max(0;Math.min(cost;limit2)-limit1)*rate2 +<br>
	   Math.max(0;Math.min(cost;limit1)-limit0)*rate1 +<br>
	   Math.max(0;Math.min(cost;limit0)-0)*rate0)</code>
	 * </p>
	 *
	 * @param cost
	 *            The total cost without support cost.
	 * @param min
	 *            The minimal cost, whatever the computation result.
	 * @param rates
	 *            The base 100 percentage to apply to a segment of cost. The segment is
	 *            <code>limit[index-1, index]</code> where index is the current index of the rate within the array. When
	 *            <code>index=0</code>, <code>limit[-1]=0</code>. When <code>index&gt;limit.lenght-1</code>,
	 *            <code>limit=Integer.MAX_VALUE</code>.
	 * @param limits
	 *            The segment upper limit where the corresponding rate can be applied. The length of this array is
	 *            lesser or equals than the <code>rates</code> array.
	 * @return The added computed support cost of each segment.
	 */
	protected double computeRates(final double cost, final int min, final int[] rates, final int[] limits) {
		double support = 0;
		for (int i = rates.length; i-- > 0;) {
			support += Math.max(0, Math.min(cost, i > limits.length - 1 ? Integer.MAX_VALUE : limits[i])
					- (i == 0 ? 0 : limits[i - 1])) / 100 * rates[i];
		}
		return Math.max(min, support);
	}

}
