<script setup lang="ts">
import { useAppOptionStore } from '@/stores/app-option';
import { RouterLink } from 'vue-router';
import { ref } from 'vue'

const appOption = useAppOptionStore();
const notificationData = [];

function toggleAppSidebarMinify() {
	appOption.appSidebarMinified = !appOption.appSidebarMinified;
}
function toggleAppSidebarMobileToggled() {
	appOption.appSidebarMobileToggled = !appOption.appSidebarMobileToggled;
}
function toggleAppHeaderSearch(event) {
	event.preventDefault();

	appOption.appHeaderSearchToggled = !appOption.appHeaderSearchToggled;
}
function checkForm(event) {
	event.preventDefault();
	this.$router.push({ path: '/extra/search' })
}
let username = ref(null)
let token = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

</script>
<template>
	<div id="header" class="app-header">
		<!-- BEGIN mobile-toggler -->
		<div class="mobile-toggler">
			<button type="button" class="menu-toggler" v-on:click="toggleAppSidebarMobileToggled">
				<span class="bar"></span>
				<span class="bar"></span>
			</button>
		</div>
		<!-- END mobile-toggler -->

		<!-- BEGIN brand -->
		<div class="brand">
			<div class="desktop-toggler">
				<button type="button" class="menu-toggler" v-on:click="toggleAppSidebarMinify">
					<span class="bar"></span>
					<span class="bar"></span>
				</button>
			</div>

			<a href="#" class="brand-logo">
				<font style="color:green">Whatsapp</font>
			</a>
		</div>
		<!-- END brand -->

		<!-- BEGIN menu -->
		<div class="menu">
			<form class="menu-search" name="header_search_form" v-on:submit="checkForm">
			</form>

			<div class="menu-item dropdown">
				<a href="#" data-bs-toggle="dropdown" data-display="static" class="menu-link">
					<div class="menu-text">{{username}}</div>
				</a>
				<div class="dropdown-menu dropdown-menu-end me-lg-3">
					<RouterLink to="/page/login" class="dropdown-item d-flex align-items-center">Logout</RouterLink>
				</div>
			</div>
		</div>
		<!-- END menu -->
	</div>
</template>
