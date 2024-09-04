<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import { Toast } from 'bootstrap';

const props = defineProps(['cart_items'])




</script>

<template>
  <div class="row gx-4">
    <div class="col-lg-12">
      <card class="mb-4">
        <card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
          {{props.cart_items.length}} Products
        </card-header>
        <card-body class="text-body" v-for="item in props.cart_items">
          <div class="row align-items-center">
            <div class="col-lg-8 d-flex align-items-center">
              <!-- <div class="h-65px w-65px d-flex align-items-center justify-content-center position-relative bg-white p-1">
                <img src="/assets/img/product/product-1.jpg" alt="" class="mw-100 mh-100">
                <span class="w-20px h-20px p-0 d-flex align-items-center justify-content-center badge bg-theme text-theme-color position-absolute end-0 top-0 fw-bold fs-12px rounded-pill mt-n2 me-n2">1</span>
              </div> -->
              <div class="ps-3 flex-1">
                <div><a href="#" class="text-decoration-none text-body">{{item['product_name']}}</a></div>
              </div>
            </div>
            <div class="col-lg-2 m-0 ps-lg-3">
              ${{item['item_price']}} x {{item['quantity']}}
            </div>
            <div class="col-lg-2 m-0 text-end">
              HKD${{ item['item_price'] * item['quantity'] }}
            </div>
          </div>
          <hr class="my-4">
        </card-body>
      </card>
    </div>
  </div>

</template>
