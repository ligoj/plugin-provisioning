/*
 * Licensed under MIT (https://github.com/ligoj/ligoj/blob/master/LICENSE)
 */
package org.ligoj.app.plugin.prov.terraform;

import java.util.Arrays;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.ligoj.app.plugin.prov.model.TerraformStatus;

/**
 * Test class of {@link TerraformRunnerResource}
 */
class TerraformRunnerResourceTest {

	private TerraformRunnerResource runner;

	@BeforeEach
	public void prepare() {
		runner = new TerraformRunnerResource();
	}

	@Test
	public void parseStateLogLineData() {
		final var status = new TerraformStatus();
		runner.parseDestroyLogLine(status, Arrays.stream(new String[] { "data.foo.bar: Refreshing state..." }));
		Assertions.assertEquals(0, status.getCompleting());
		Assertions.assertEquals(1, status.getCompleted());
	}

	@Test
	public void parseStateLogLineDestroying() {
		final var status = new TerraformStatus();
		runner.parseDestroyLogLine(status, Arrays.stream(new String[] { "foo.bar: Destroying... (ID: 0)" }));
		Assertions.assertEquals(1, status.getCompleting());
		Assertions.assertEquals(0, status.getCompleted());
	}

	@Test
	public void parseStateLogLineStillDestroying() {
		final var status = new TerraformStatus();
		runner.parseDestroyLogLine(status, Arrays.stream(new String[] { "foo.bar: Still destroying... (ID: 0)" }));
		Assertions.assertEquals(0, status.getCompleting());
		Assertions.assertEquals(0, status.getCompleted());
	}

	@Test
	public void parseStateLogLineCompleted() {
		final var status = new TerraformStatus();
		runner.parseDestroyLogLine(status, Arrays.stream(new String[] { "foo.bar: Destruction complete after 0s" }));
		Assertions.assertEquals(-1, status.getCompleting());
		Assertions.assertEquals(1, status.getCompleted());
	}

	@Test
	public void parseStateLogLineRefreshing() {
		final var status = new TerraformStatus();
		runner.parseDestroyLogLine(status, Arrays.stream(new String[] { "foo.bar: Refreshing state... (ID: 0)" }));
		Assertions.assertEquals(0, status.getCompleting());
		Assertions.assertEquals(0, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineNotTerraform() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "  foo.bar: Destroying... " }));
		Assertions.assertEquals(0, status.getCompleting());
		Assertions.assertEquals(0, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineDestruction() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Creation complete after 0s (ID: 0)" }));
		Assertions.assertEquals(-1, status.getCompleting());
		Assertions.assertEquals(1, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineCreating() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Creating... (ID: 0)" }));
		Assertions.assertEquals(1, status.getCompleting());
		Assertions.assertEquals(0, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineModifying() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Modifying... (ID: 0)" }));
		Assertions.assertEquals(1, status.getCompleting());
		Assertions.assertEquals(0, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineDestroying() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Destroying... (ID: 0)" }));
		Assertions.assertEquals(1, status.getCompleting());
		Assertions.assertEquals(0, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineStillDestroying() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Still destroying... (ID: 0)" }));
		Assertions.assertEquals(0, status.getCompleted());
		Assertions.assertEquals(0, status.getCompleting());
	}

	@Test
	public void parseApplyLogLineModificationsCompleted() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Modifications complete after 0s" }));
		Assertions.assertEquals(-1, status.getCompleting());
		Assertions.assertEquals(1, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineCreationCompleted() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Creation complete after 0s" }));
		Assertions.assertEquals(-1, status.getCompleting());
		Assertions.assertEquals(1, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineCompleted() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Destruction complete after 0s" }));
		Assertions.assertEquals(-1, status.getCompleting());
		Assertions.assertEquals(1, status.getCompleted());
	}

	@Test
	public void parseApplyLogLineRefreshing() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "foo.bar: Refreshing state... (ID: 0)" }));
		Assertions.assertEquals(0, status.getCompleted());
		Assertions.assertEquals(0, status.getCompleting());
	}

	@Test
	public void parseApplyLogLineData() {
		final var status = new TerraformStatus();
		runner.parseApplyLogLine(status, Arrays.stream(new String[] { "data.foo.bar: Refreshing state..." }));
		Assertions.assertEquals(0, status.getCompleted());
		Assertions.assertEquals(0, status.getCompleting());
	}

}
