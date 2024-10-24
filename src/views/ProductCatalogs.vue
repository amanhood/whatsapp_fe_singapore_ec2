
<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest,formdataRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import 'vue-select/dist/vue-select.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let catalogs = ref([])
let business_account_id = ref(null)
let input_business_account_id = ref(null)
let notification_message = ref(null)
let catalog_name = ref(null)
let selected_catalog = ref(null)
let retailer_id = ref(null)
let name = ref(null)
let description = ref(null)
let price = ref(null)
let sale_price = ref(null)
let currency = ref(null)
let image_url = ref(null)
let additional_image_urls = ref(null)
let availability = ref(null)
let url = ref(null)
let retailer_product_group_id = ref(null)
let brand = ref(null)
let weight = ref(null)
let weight_unit = ref(null)
let availability_options = [
  {value:'in stock',label:'in stock'},
  {value:'out of stock',label:'out of stock'},
  {value:'preorder',label:'preorder'},
  {value:'available for order',label:'available for order'},
  {value:'discontinued',label:'discontinued'},
  {value:'pending',label:'pending'},
  {value:'pending',label:'mark_as_sold'}
]
let currency_options = [
  {value:'HKD',label:'HKD'},
  {value:'USD',label:'USD'}
]
let weight_options = [
  {value:'kg',label:'kg'},
  {value:'g',label:'g'},
  {value:'lb',label:'lb'},
  {value:'oz',label:'oz'}
]
let single_or_multiple = ref(null)
let selectedFile = ref(null)
let update_only = ref(null)
let update_options = [
  {value:'true',label:'true'},
  {value:'false',label:'false'}
]
let is_cart_enabled = ref(null)
let is_catalog_visible = ref(null)
let catalog_link = ref(null)
let products = []
let is_product_show = ref(false)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
}

async function selectWaBa(waba_id,phone_number_id,phone_number){
  selected_waba_account.value = waba_id
  selected_phone_number_id.value = phone_number_id
  get_business_account(phone_number)
}


async function addBusinessAccount(){
	let payload = {}
	payload['business_account_id'] = input_business_account_id.value
	payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("add_business_account",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      if(data['data']['catalogs']['error']){
        let message = data['data']['catalogs']['error']['message']
				showToast(message)
			} else {
				business_account_id.value = data['data']['business_account_id']
				catalogs.value = data['data']['catalogs']['data']
			}
		}
  }
}

async function get_business_account(phone_number){
	let payload = {}
	payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("get_business_account",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      if(data['data']['catalogs']['error']){
        let message = data['data']['catalogs']['error']['message']
				showToast(message)
			} else {
        if(data['data']['business_account_id']){
  				business_account_id.value = data['data']['business_account_id']
  				catalogs.value = data['data']['catalogs']['data']
          if(catalogs.value.length > 0){
            catalog_link.value = "https://wa.me/c/" + phone_number.replace(/[ +]/g, "")
          }
  			}
			}
		}
  }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

function selectCatalog(catalog) {
  selected_catalog.value = catalog
}

async function addCatalog(){
  let payload = {}
	payload['catalog_name'] = catalog_name.value
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("add_product_catalog",payload,token)
  if(data.request.status == 200){
    get_business_account()
    catalog_name.value = null
  } else {
    console.log(data)
  }
}

async function editCatalog(catalog){
  let payload = {}
	payload['catalog_name'] = catalog.name
  payload['catalog_id'] = catalog.id
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("update_product_catalog",payload,token)
  if(data.request.status == 200){
    get_business_account()
    catalog_name.value = null
  } else {
    console.log(data)
  }
}

async function uploadProduct(){
  let payload = {}
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['catalog_id'] = selected_catalog.value.id
  payload['retailer_id'] = retailer_id.value
  payload['name'] = name.value
  payload['description'] = description.value
  payload['price'] = price.value
  payload['sale_price'] = sale_price.value
  payload['currency'] = currency.value
  payload['image_url'] = image_url.value
  let image_urls = []
  if(additional_image_urls.value.includes(',')){
    additional_image_urls.value = additional_image_urls.value.replace(/(\r\n|\n|\r)/gm, '')
    image_urls = additional_image_urls.value.split(',')
  } else {
    image_urls.push(additional_image_urls.value)
  }
  payload['additional_image_urls'] = image_urls
  payload['availability'] = availability.value
  payload['url'] = url.value
  payload['retailer_product_group_id'] = retailer_product_group_id.value
  payload['brand'] = brand.value
  payload['weight'] = weight.value
  payload['weight_unit'] = weight_unit.value
  let data = await postRequest("upload_product",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      let message = "Product is successfully created"
      showToast(message)
    }
  } else {
    console.log(data)
  }
}

function singleOrMutliple(uplaod_type){
  single_or_multiple.value = uplaod_type
}

function onFileChange(event) {
  selectedFile.value = event.target.files[0]; // Store the selected file
}

async function uploadFile(){
  if(!selectedFile.value) {
    let message = 'Please select a file to upload'
    showToast(message)
    return;
  }
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('waba_id', selected_waba_account.value);
  formData.append('phone_number_id', selected_phone_number_id.value);
  formData.append('catalog_id', selected_catalog.value.id);
  formData.append('update_only', update_only.value);
  selected_catalog
  let data = await formdataRequest("batch_import_products",formData,token)
  console.log(data)
  if(data.request.status == 200){
    if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      let message = "Product is successfully created"
      showToast(message)
    }
  } else {
    console.log(data)
  }

}

async function update_cart_status(status){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  payload['status'] = status
  let data = await postRequest("update_cart_status",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      whatsapp_commerce_setting()
		}
  }
}

async function visible_catalog_icon(status){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  payload['status'] = status
  let data = await postRequest("visible_catalog_icon",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      whatsapp_commerce_setting()
		}
  }
}

async function whatsapp_commerce_setting(){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("whatsapp_commerce_setting",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      is_cart_enabled.value = data['data']['data'][0]['is_cart_enabled']
      is_catalog_visible.value = data['data']['data'][0]['is_catalog_visible']
		}
  }
}

function copyLink(catalog_link){
  navigator.clipboard.writeText(catalog_link)
        .then(() => {
          let message = "link copied to clipboard"
    			showToast(message)
        })
        .catch(err => {
          let message = "Failed to copy link"
    			showToast(message)
        });
}

async function showProducts(selected_catalog){
  let payload = {}
  payload['catalog_id'] = selected_catalog.id
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("show_products",payload,token)
  if(data.request.status == 200){
    products.value = data['data']
    is_product_show.value = true
    console.log(products.value)
  } else {

	}
}



checkLogin()
checkWaba()
</script>

<style scoped>
#margin_10 {
  margin-top:10px;
  margin-bottom:10px;
}
</style>

<template>
  <div class="toasts-container">
    <div class="toast fade hide" data-autohide="false" id="toast-1">
      <div class="toast-header">
        <i class="far fa-bell text-muted me-2"></i>
        <strong class="me-auto">Alert</strong>
        <small></small>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        {{notification_message}}
      </div>
    </div>
  </div>

  <card>
    <card-body class="pb-2">
      <div class="row" v-if="whatsapp_accounts.length > 0">
        <div class="col-xl-9">
          <div class="form-group mb-3">
            <div class="flex-fill fw-bold fs-16px">Select business whatsapp account for managing cart and product catalogues</div>
          </div>
          <div class="form-group mb-3">
            <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="selectWaBa(account.waba_id,account.phone_number_id,account.phone_number)" v-for="account in whatsapp_accounts">{{account.phone_number}}</button>
          </div>
        </div>
        <hr>
      </div>
    </card-body>

    <fragment v-if="selected_waba_account">
      <card-body class="pb-2">
          <div class="row">
            <div class="col-xl-12">
              <div class="form-group mb-3">
                <div class="flex-fill fw-bold fs-16px">Cart setting</div>
              </div>
            </div>
            <div class="col-md-12">
              <div class="row">
                <div class="col-md-8">
                  <fragment>
                    <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="update_cart_status('false')" v-if="is_cart_enabled">unable cart</button>
                    <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="update_cart_status('true')" v-else>enable cart</button>
                  </fragment>
                  <fragment>
                    <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="visible_catalog_icon('false')" v-if="is_catalog_visible">cart icon invisible</button>
                    <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="visible_catalog_icon('true')" v-else>cart icon visible</button>
                  </fragment>
                  <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="copyLink(catalog_link)">copy {{catalog_link}}</button>
                </div>
              </div>
            </div>
          </div>
          <hr>
      </card-body>
      <card-body class="pb-2" v-if="!business_account_id">
          <div class="row">
            <div class="col-xl-12">
              <div class="form-group mb-3">
                <div class="flex-fill fw-bold fs-16px">At Meta Business Manager, Go to Business settings. Select Business info from the sidebar. Below your business portfolio name, you'll find your business ID number.</div>
              </div>
            </div>
          </div>
      </card-body>

      <card-body class="pb-2" v-if="!business_account_id">
          <div class="row">
            <div class="col-md-6">
              <div class="row">
                <div class="col-md-8">
                  <input type="number" class="form-control ps-35px" placeholder="add business account id and get catalogs" v-model="input_business_account_id"/>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-default rounded-0" type="button" @click="addBusinessAccount"><span class="d-none d-md-inline">Add</span></button>
                </div>
              </div>
            </div>
          </div>
          <hr>
      </card-body>
    </fragment>


    <card-body class="pb-2" v-if="business_account_id">
      <div class="row">
        <div class="col-xl-3" style="border:1px solid #ccc;">
          <div class="flex-fill fw-bold fs-16px" id="margin_10">Product Catalogues</div>

          <div class="row" v-for="catalog in catalogs" v-if="catalogs.length > 0">
            <div class="row" style="margin-bottom:10px;">
              <div class="col-md-7">
                <input type="text" class="form-control" placeholder="Title" v-model="catalog.name">
              </div>
              <div class="col-md-2">
                <button type="button" class="btn btn-default mb-1 me-1" @click="editCatalog(catalog)">Edit</button>
              </div>
              <div class="col-md-2">
                <button type="button" class="btn btn-default mb-1 me-1" @click="selectCatalog(catalog)">Select</button>
              </div>
            </div>
            <hr>
          </div>


          <div class="row">
            <div class="row" id="margin_10">
              <div class="col-md-10">
                <input type="text" class="form-control" placeholder="Catalog Name" v-model="catalog_name">
              </div>
            </div>
            <div class="form-group mb-3" id="margin_10">
              <button type="button" class="btn btn-default mb-1 me-1" @click="addCatalog">Add Catalog</button>
            </div>
          </div>
        </div>

        <div class="col-xl-9" style="border-right:1px solid #ccc;border-top:1px solid #ccc;border-bottom:1px solid #ccc;">
          <fragment v-if="selected_catalog">
          <div class="flex-fill fw-bold fs-16px" id="margin_10">Upload Product(s) to ({{selected_catalog.name}})</div>
          <div class="row" id='margin_10'>
            <div class="col-md-3">
              <div class="row">
                <div class="col-md-4"><button type="button" class="btn btn-default mb-1 me-1" @click="showProducts(selected_catalog)">Show products</button></div>
                <div class="col-md-4"><button type="button" class="btn btn-default mb-1 me-1" @click="singleOrMutliple('single')">Single Product</button></div>
                <div class="col-md-4"><button type="button" class="btn btn-default mb-1 me-1" @click="singleOrMutliple('multiple')">Multiple Products</button></div>
              </div>
            </div>
          </div>
          <hr>
          </fragment>

          <fragment v-if="selected_catalog && is_product_show ==true">
            <!-- BEGIN pos-content -->
            <div class="pos pos-with-menu pos-with-sidebar" v-bind:class="{ 'pos-mobile-sidebar-toggled': mobileSidebarToggled }">
              <div class="pos-container">
          			<div class="pos-content">
          				<div class="pos-content-container h-100">
          					<div class="row gx-4">
          						<template v-for="product in products">
          							<div class="col-xxl-3 col-xl-4 col-lg-6 col-md-4 col-sm-6 pb-4" >
          								<a href="#" class="pos-product" v-on:click="(event) => showFoodModal(event, product.id)">
          									<div class="img" v-bind:style="{ backgroundImage: 'url('+ product.image_url +')' }"></div>
          									<div class="info">
          										<div class="title">{{ product.name }}</div>
          										<div class="desc">{{ product.description }}</div>
          										<div class="price">${{ product.price }}</div>
          									</div>
          								</a>
          							</div>
          						</template>
          					</div>
          				</div>
          			</div>
              </div>
        			<!-- END pos-content -->
            </div>
          </fragment>

          <fragment v-if="selected_catalog && single_or_multiple =='single'">
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <input type="text" class="form-control" placeholder="retailer_id" v-model="retailer_id"/>
              </div>
              <div class="col-md-3">
                <input type="text" class="form-control" placeholder="name" v-model="name"/>
              </div>
              <div class="col-md-3">
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" placeholder="product description" v-model="description"></textarea>
              </div>
              <div class="col-md-3">
                <input type="text" class="form-control" placeholder="retailer_product_group_id" v-model="retailer_product_group_id"/>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <select class="form-select" id="exampleFormControlSelect1" v-model="currency">
                  <option v-for="item in currency_options" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
              <div class="col-md-3">
                <input type="number" class="form-control" placeholder="Price (100 = 1.00)" v-model="price"/>
              </div>
              <div class="col-md-3">
                <input type="number" class="form-control" placeholder="Sale Price (100 = 1.00)" v-model="sale_price"/>
              </div>
              <div class="col-md-3">
                <select class="form-select" id="exampleFormControlSelect1" v-model="availability">
                  <option v-for="item in availability_options" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <input type="text" class="form-control" placeholder="url" v-model="url"/>
              </div>
              <div class="col-md-3">
                <input type="text" class="form-control" placeholder="Brand" v-model="brand"/>
              </div>
              <div class="col-md-3">
                <input type="number" class="form-control" placeholder="Weight (kg)" v-model="weight"/>
              </div>
              <div class="col-md-3">
                <select class="form-select" id="exampleFormControlSelect1" v-model="weight_unit">
                  <option v-for="item in weight_options" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-6">
                <input type="text" class="form-control" placeholder="image_url" v-model="image_url"/>
              </div>
              <div class="col-md-6">
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" placeholder="image urls, seperate by ," v-model="additional_image_urls"></textarea>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <button type="button" class="btn btn-default" @click="uploadProduct">Upload a product</button>
              </div>
            </div>
          </fragment>
          <fragment v-if="selected_catalog && single_or_multiple =='multiple'">
          <div class="row" id='margin_10'>
            <div class="col-md-8">
              <div class="row" style="margin-bottom:10px;">
                <a href="/sample_template.csv">Download a template for batch importing products</a>
              </div>
              <div class="row" style="margin-bottom:10px;padding-left:10px;">
                When set to false, the feed is treated as a replace feed. That means with every new incoming update, if we do not find the set of items created previously, they will be deleted.
              </div>
              <div class="row" style="margin-bottom:10px;padding-left:10px;">
                When set to true, we create new items and update existing ones, but don't delete items from the feed. You only need to provide ID to update existing items. This reduces time to fetch and process your file.
              </div>
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-3">
                  <select class="form-select" id="exampleFormControlSelect1" v-model="uplaod_only">
                    <option v-for="item in update_options" :key="item.value" :value="item.value">{{item.label}}</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6"><input type="file" class="form-control" id="defaultFile" @change="onFileChange" accept=".csv" /></div>
                <div class="col-md-6"><button @click="uploadFile" class="btn btn-default" :disabled="!selectedFile">Upload</button></div>
              </div>
            </div>
          </div>
          </fragment>

        </div>
      </div>
      <!-- END row -->
    </card-body>
  </card>
</template>
