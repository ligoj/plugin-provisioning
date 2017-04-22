package org.ligoj.app.plugin.prov.dao;

import java.util.List;

import org.ligoj.app.plugin.prov.model.ProvInstancePrice;
import org.ligoj.app.plugin.prov.model.VmOs;
import org.ligoj.bootstrap.core.dao.RestRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

/**
 * {@link ProvInstancePrice} repository.
 */
public interface ProvInstancePriceRepository extends RestRepository<ProvInstancePrice, Integer> {

	/**
	 * Return the lowest instance price configuration from the minimal
	 * requirements.
	 * 
	 * @param node
	 *            The requested provider node.
	 * @param cpu
	 *            The minimum CPU.
	 * @param ram
	 *            The minimum RAM in MB.
	 * @param constant
	 *            The constant CPU behavior constraint.
	 * @param os
	 *            The requested OS.
	 * @param type
	 *            The optional pricing type. May be <code>null</code>.
	 * @param pageable
	 *            The page control to return few item.
	 * @return The minimum instance or <code>null</code>.
	 */
	@Query("FROM #{#entityName} ip INNER JOIN FETCH ip.instance AS i INNER JOIN FETCH ip.type AS t"
			+ " WHERE (:node = i.node.id OR node LIKE CONCAT(i.node,'%'))"
			+ " AND i.cpu>= :cpu AND i.ram>=:ram AND ip.os=:os AND (:constant = false OR i.constant = :constant)"
			+ " AND (:type IS NULL OR t.id = :type) ORDER BY ip.cost ASC")
	List<ProvInstancePrice> findLowestPrice(String node, int cpu, int ram, boolean constant, VmOs os, Integer type,
			Pageable pageable);
}