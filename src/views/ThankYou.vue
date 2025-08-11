<script setup>
import { useAppOptionStore } from '@/stores/app-option';
import { ref,onMounted,watch } from 'vue'
const appOption = useAppOptionStore();

onMounted(()=> {
  	appOption.appSidebarHide = true;
	appOption.appHeaderHide = true;
	appOption.appContentClass = 'p-0';
})
</script>

<template>
	<div class="row gx-4" style="padding:2px;">
		<div class="col-lg-12">
			<card class="mb-4">
				<card-body>
					<div class="row">
						<div class="col-md-12" style="text-align:center;font-size:16px;font-weight:bold;">
							Thank you for your submission
						</div>
					</div>
                </card-body>
			</card>
		</div>
	</div>
</template>