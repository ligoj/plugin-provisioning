package org.ligoj.app.plugin.prov;

import java.util.function.Function;

import javax.transaction.Transactional;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.ligoj.app.api.ConfigurablePlugin;
import org.ligoj.app.iam.IamProvider;
import org.ligoj.app.iam.UserOrg;
import org.ligoj.app.plugin.prov.dao.QuoteRepository;
import org.ligoj.app.plugin.prov.model.Quote;
import org.ligoj.app.resource.ServicePluginLocator;
import org.ligoj.app.resource.plugin.AbstractServicePlugin;
import org.ligoj.app.resource.subscription.SubscriptionResource;
import org.ligoj.bootstrap.core.DescribedBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * The Virtual Machine service.
 */
@Service
@Path(ProvResource.SERVICE_URL)
@Produces(MediaType.APPLICATION_JSON)
public class ProvResource extends AbstractServicePlugin implements ConfigurablePlugin {

	/**
	 * Plug-in key.
	 */
	public static final String SERVICE_URL = BASE_URL + "/provisionning";

	/**
	 * Plug-in key.
	 */
	public static final String SERVICE_KEY = SERVICE_URL.replace('/', ':').substring(1);

	@Autowired
	protected SubscriptionResource subscriptionResource;

	@Autowired
	protected ServicePluginLocator servicePluginLocator;

	@Autowired
	private QuoteRepository repository;

	@Autowired
	protected IamProvider[] iamProvider;

	@Override
	public String getKey() {
		return SERVICE_KEY;
	}

	private Function<String, ? extends UserOrg> toUser() {
		return this.iamProvider[0].getConfiguration().getUserRepository()::toUser;
	}

	@GET
	@Path("{subscription:\\d+}")
	@Override
	@Transactional
	@org.springframework.transaction.annotation.Transactional(readOnly = true)
	public QuoteVo getConfiguration(@PathParam("subscription") final int subscription) {
		final QuoteVo vo = new QuoteVo();
		// TODO Add instance & storage details required to build the UI
		return vo;
	}

	/**
	 * Return the quote status linked to given subscription.
	 * 
	 * @param subscription
	 *            The parent subscription identifier.
	 * @return The quote status (summary only) linked to given subscription.
	 */
	@Transactional
	@org.springframework.transaction.annotation.Transactional(readOnly = true)
	public QuoteLigthVo getSusbcriptionStatus(final int subscription) {
		final QuoteLigthVo vo = new QuoteLigthVo();
		final Object[] resultset = repository.getSummary(subscription);
		final Quote entity = (Quote) resultset[0];
		vo.copyAuditData(entity, this.toUser());
		DescribedBean.copy(entity, vo);
		vo.setCost(entity.getCost());
		vo.setNbInstances(((Long) resultset[1]).intValue());
		vo.setTotalCpu(((Long) resultset[2]).intValue());
		vo.setTotalMemory(((Long) resultset[3]).intValue());
		vo.setTotalStorage(((Long) resultset[4]).intValue());
		return vo;
	}

}
