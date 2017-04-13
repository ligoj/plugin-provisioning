package org.ligoj.app.plugin.prov.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

import org.ligoj.app.model.Node;
import org.ligoj.bootstrap.core.model.AbstractDescribedEntity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;

/**
 * An instance price configuration
 */
@Getter
@Setter
@Entity
@Table(name = "LIGOJ_VM_INSTANCE_PRICE_TYPE", uniqueConstraints = @UniqueConstraint(columnNames = { "name", "node" }))
public class ProvInstancePriceType extends AbstractDescribedEntity<Integer> {

	/**
	 * SID
	 */
	private static final long serialVersionUID = 4795855466011388616L;

	/**
	 * Billing period in minutes. Any started period is due.
	 */
	@NotNull
	@Min(1)
	private Integer period;

	/**
	 * The related node (VM provider) of this instance.
	 */
	@NotNull
	@ManyToOne
	@JsonIgnore
	private Node node;

}
