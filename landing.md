---
title: Learn More
layout: landing
description: 'Discuss how this system can increase revenues. Possibly discuss each service we offer in more detail. Possibly have charts as well and sample reports'
image: assets/images/pic07.jpg
nav-menu: true
---

<!-- Main -->
<div id="main">

<!-- One -->
<section id="one">
	<div class="inner">
		<header class="major">
			<h2>Sed amet aliquam</h2>
		</header>
		<p>Nullam et orci eu lorem consequat tincidunt vivamus et sagittis magna sed nunc rhoncus condimentum sem. In efficitur ligula tate urna. Maecenas massa vel lacinia pellentesque lorem ipsum dolor. Nullam et orci eu lorem consequat tincidunt. Vivamus et sagittis libero. Nullam et orci eu lorem consequat tincidunt vivamus et sagittis magna sed nunc rhoncus condimentum sem. In efficitur ligula tate urna.</p>
	</div>
</section>

<section id="revenue-calculator" style="max-width:600px; margin:3rem auto; padding:2rem; border:1px solid #ddd; border-radius:12px; background:#1a1a1a; color:#fff; font-family:Arial, sans-serif; font-weight:normal;">
  <h2 style="text-align:center; margin-bottom:1rem; font-weight:normal;">Calculate Your Revenue Impact</h2>
  <p style="text-align:center; margin-bottom:2rem; color:#ccc; font-weight:normal;">Estimate how much revenue could be at risk from account sharing and how much you could recover.</p>

  <form id="calculator-form" style="display:flex; flex-direction:column; gap:1rem;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <label for="numUsers" style="font-weight:normal;">Number of paying accounts:</label>
      <input type="number" id="numUsers" placeholder="e.g., 1000" required style="padding:0.5rem; border-radius:6px; border:none; font-size:1rem; color:#000; width:150px;">
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <label for="subscriptionPrice" style="font-weight:normal;">Monthly subscription price ($):</label>
      <input type="number" id="subscriptionPrice" placeholder="e.g., 10" required step="0.01" style="padding:0.5rem; border-radius:6px; border:none; font-size:1rem; color:#000; width:150px;">
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <label for="sharedPercent" style="font-weight:normal;">% of accounts being shared:</label>
      <input type="number" id="sharedPercent" placeholder="e.g., 15" required step="0.1" min="0" max="100" style="padding:0.5rem; border-radius:6px; border:none; font-size:1rem; color:#000; width:150px;">
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <label for="extraUsers" style="font-weight:normal;">Average extra users per shared account:</label>
      <input type="number" id="extraUsers" placeholder="e.g., 2" required step="0.1" min="0" style="padding:0.5rem; border-radius:6px; border:none; font-size:1rem; color:#000; width:150px;">
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;">
      <label for="conversionRate" style="font-weight:normal;">% of extra users that convert after being caught:</label>
      <input type="number" id="conversionRate" placeholder="e.g., 50" required step="0.1" min="0" max="100" style="padding:0.5rem; border-radius:6px; border:none; font-size:1rem; color:#000; width:150px;">
    </div>
  </form>

  <div style="margin-top:2rem; display:flex; flex-direction:column; gap:1rem; text-align:center;">
    <div style="background:#333; padding:1rem; border-radius:8px; font-weight:normal;">
      <span>Estimated Revenue Lost:</span>
      <p id="revenueLostOutput" style="font-size:1.5rem; margin-top:0.5rem; font-weight:normal;">$0</p>
    </div>
    <div style="background:#333; padding:1rem; border-radius:8px; font-weight:normal;">
      <span>Estimated Recoverable Revenue:</span>
      <p id="revenueOutput" style="font-size:1.5rem; margin-top:0.5rem; font-weight:normal;">$0</p>
    </div>
  </div>
</section>

<script>
  const inputs = ['numUsers','subscriptionPrice','sharedPercent','extraUsers','conversionRate'];
  const revenueLostOutput = document.getElementById('revenueLostOutput');
  const revenueOutput = document.getElementById('revenueOutput');

  function calculateRevenue() {
    const numUsers = parseFloat(document.getElementById('numUsers').value) || 0;
    const subscriptionPrice = parseFloat(document.getElementById('subscriptionPrice').value) || 0;
    const sharedPercent = parseFloat(document.getElementById('sharedPercent').value) || 0;
    const extraUsers = parseFloat(document.getElementById('extraUsers').value) || 0;
    const conversionRate = parseFloat(document.getElementById('conversionRate').value) || 0;

    const revenueLost = numUsers * (sharedPercent / 100) * extraUsers * subscriptionPrice;
    const revenueRecovered = revenueLost * (conversionRate / 100);

    revenueLostOutput.textContent = `$${revenueLost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    revenueOutput.textContent = `$${revenueRecovered.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  }

  inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', calculateRevenue);
  });
</script>


<!-- Two -->
<section id="two" class="spotlights">
	<section>
		<a href="generic.html" class="image">
			<img src="{% link assets/images/unsharedlabs-stock-img2.webp %}" alt="" data-position="full" />
		</a>
		<div class="content">
			<div class="inner">
				<header class="major">
					<h3>Orci maecenas</h3>
				</header>
				<p>Test.</p>
				<ul class="actions">
					<li><a href="generic.html" class="button">Learn more</a></li>
				</ul>
			</div>
		</div>
	</section>
	<section>
		<a href="generic.html" class="image">
			<img src="{% link assets/images/unsharedlabs-stock-img4.webp %}" alt="" data-position="top center" />
		</a>
		<div class="content">
			<div class="inner">
				<header class="major">
					<h3>Rhoncus magna</h3>
				</header>
				<p>Test.</p>
				<ul class="actions">
					<li><a href="generic.html" class="button">Learn more</a></li>
				</ul>
			</div>
		</div>
	</section>
	<section>
		<a href="generic.html" class="image">
			<img src="{% link assets/images/unsharedlabs-stock-img7.webp %}" alt="" data-position="25% 25%" />
		</a>
		<div class="content">
			<div class="inner">
				<header class="major">
					<h3>Sed nunc ligula</h3>
				</header>
				<p>Test.</p>
				<ul class="actions">
					<li><a href="generic.html" class="button">Learn more</a></li>
				</ul>
			</div>
		</div>
	</section>
</section>
</div>
