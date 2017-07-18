package org.ligoj.app.plugin.prov;

import java.util.HashMap;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;

/**
 * The updated cost of an updated resource..
 */
@Getter
@Setter
public class UpdatedCost {

	/**
	 * The quote instance identifier.
	 */
	private int id;

	/**
	 * The new total quote cost.
	 */
	private FloatingCost totalCost;

	/**
	 * The new resource cost.
	 */
	private FloatingCost resourceCost;

	/**
	 * The new related costs of the update resource. For sample, storage for
	 * associated instance..
	 */
	private Map<Integer, FloatingCost> relatedCosts = new HashMap<>();
}