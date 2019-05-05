/*
 * Licensed under MIT (https://github.com/ligoj/ligoj/blob/master/LICENSE)
 */
package org.ligoj.app.plugin.prov.model;

import java.util.List;
import java.util.Optional;

import javax.persistence.ManyToOne;
import javax.persistence.MappedSuperclass;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PositiveOrZero;

import org.ligoj.bootstrap.core.INamableBean;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A resource related to an instance and with floating cost.
 *
 * @param <P>
 *            Price configuration type.
 */
@Getter
@Setter
@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class AbstractQuoteResourceInstance<P extends AbstractPrice<?>> extends AbstractQuoteResource<P>
		implements QuoteVm {

	/**
	 * SID
	 */
	private static final long serialVersionUID = 1L;

	/**
	 * Included license.
	 */
	public static final String LICENSE_INCLUDED = "INCLUDED";

	/**
	 * The requested CPU.
	 */
	@PositiveOrZero
	private double cpu;

	/**
	 * The requested RAM in "MiB". 1MiB = 1024 MiB.
	 */
	@PositiveOrZero
	private int ram;

	/**
	 * The requested CPU behavior. When <code>false</code>, the CPU is variable, with boost mode.
	 */
	private Boolean constant;

	/**
	 * The Internet access : Internet facing, etc.
	 */
	@NotNull
	private InternetAccess internet = InternetAccess.PUBLIC;

	/**
	 * The minimal quantity of this instance.
	 */
	@NotNull
	@PositiveOrZero
	private int minQuantity = 1;

	/**
	 * The maximal quantity of this instance. May be <code>null</code> when unbound maximal, otherwise must be greater
	 * than {@link #minQuantity}
	 */
	@PositiveOrZero
	private Integer maxQuantity = 1;

	/**
	 * Optional usage for this resource when different from the related quote.
	 */
	@ManyToOne
	private ProvUsage usage;

	/**
	 * Optional license model. When <code>null</code>, the configuration license model will be used. May be
	 * {@value #LICENSE_INCLUDED}.
	 */
	private String license;

	@Override
	@JsonIgnore
	public boolean isUnboundCost() {
		return maxQuantity == null;
	}

	/**
	 * Return the resource type.
	 *
	 * @return The resource type.
	 */
	public abstract ResourceType getResourceType();

	/**
	 * Return attached storages.
	 *
	 * @return Attached storages.
	 */
	public abstract List<ProvQuoteStorage> getStorages();

	/**
	 * Return the effective usage applied to the given resource. May be <code>null</code>.
	 *
	 * @return The effective usage applied to the given resource. May be <code>null</code>.
	 */
	public ProvUsage getResolvedUsage() {
		return usage == null ? getConfiguration().getUsage() : usage;
	}

	/**
	 * Return the usage name applied to the given resource. May be <code>null</code>.
	 *
	 * @return The usage name applied to the given resource. May be <code>null</code>.
	 */
	@Override
	public String getUsageName() {
		return Optional.ofNullable(getResolvedUsage()).map(INamableBean::getName).orElse(null);
	}

	/**
	 * Return the resolved location name applied to the given resource.
	 *
	 * @return The resolved location name applied to the given resource.
	 */
	@Override
	public String getLocationName() {
		return getResolvedLocation().getName();
	}

}
