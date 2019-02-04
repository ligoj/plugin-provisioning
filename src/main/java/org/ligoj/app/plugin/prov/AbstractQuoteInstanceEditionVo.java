/*
 * Licensed under MIT (https://github.com/ligoj/ligoj/blob/master/LICENSE)
 */
package org.ligoj.app.plugin.prov;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.PositiveOrZero;

import org.ligoj.app.plugin.prov.model.InternetAccess;
import org.ligoj.bootstrap.core.DescribedBean;

import lombok.Getter;
import lombok.Setter;

/**
 * Quote for an instance while editing it.
 */
@Getter
@Setter
public abstract class AbstractQuoteInstanceEditionVo extends DescribedBean<Integer> {

	/**
	 * SID
	 */
	private static final long serialVersionUID = 1L;

	/**
	 * Instance price configuration matching to the requirements.
	 */
	@NotNull
	@Positive
	private Integer price;

	/**
	 * Related subscription identifier.
	 */
	@NotNull
	@Positive
	private Integer subscription;

	/**
	 * The requested CPU
	 */
	@NotNull
	@Positive
	private Double cpu;

	/**
	 * The requested memory in MB.
	 */
	@NotNull
	@Positive
	private Integer ram;

	/**
	 * The optional requested CPU behavior. When <code>false</code>, the CPU is variable, with boost mode.
	 */
	private Boolean constant;

	/**
	 * The Internet access : Internet facing, etc.
	 */
	@NotNull
	private InternetAccess internet = InternetAccess.PRIVATE;

	/**
	 * The minimal quantity of this instance.
	 */
	@PositiveOrZero
	@NotNull
	private Integer minQuantity = 1;

	/**
	 * The maximal quantity of this instance. When defined, must be greater than {@link #minQuantity}
	 */
	@PositiveOrZero
	private Integer maxQuantity;

	/**
	 * Optional required location name. When <code>null</code>, the default quote's one will be used.
	 */
	private String location;

	/**
	 * Optional applied usage name. When <code>null</code>, the default quote's one will be used.
	 */
	private String usage;

	/**
	 * Optional license model. When <code>null</code>, global's configuration is used. "BYOL" and "INCLUDED" are
	 * accepted.
	 */
	private String license;
}