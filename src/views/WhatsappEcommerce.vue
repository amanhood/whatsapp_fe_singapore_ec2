<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest,putRequest,formdataRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import FormWizards from './FormWizards.vue';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let business_account_id = ref(null)
let input_business_account_id = ref(null)
let notification_message = ref(null)
let catalogs = ref([])
let catalog_link = ref(null)
let catalog_name = ref(null)
let selected_catalog = ref(null)
let retailer_id = ref(null)
let name = ref(null)
let description = ref(null)
let price = ref(null)
let sale_price = ref(null)
let currency = ref(null)
let image_url = ref(null)
let additional_image_urls = ref([])
let update_additional_image_urls = ref([])
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

let function_options = [
  {value:'show_products',label:'Show products'},
  {value:'single',label:'Create single product'},
  {value:'multiple',label:'Upload multiple products'}
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
let products = ref([])
let is_product_show = ref(false)
let url_index = ref(1)
let edit_url_index = ref(1)
let selected_product = ref(null)
let error_message = ref(null)
let delete_catalog = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
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
          //console.log(business_account_id.value)
          catalogs.value = data['data']['catalogs']['data']
          if(catalogs.value.length > 0){
            catalog_link.value = "https://wa.me/c/" + phone_number.replace(/[ +]/g, "")
          }
  			}
			}
		}
  }
}

function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  selected_phone_number.value = select_account.value.value
  get_business_account(selected_phone_number.value)
  whatsapp_commerce_setting()
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

function go(){
  router.push({
      path: '/page/connect-business-account'
  });
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

async function editCatalog(catalog){
  let payload = {}
	payload['catalog_name'] = catalog.name
  payload['catalog_id'] = catalog.id
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("update_product_catalog",payload,token)
  if(data.request.status == 200){
    get_business_account(selected_phone_number.value)
    catalog_name.value = null
    if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		}
  } else {
    console.log(data)
  }
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

async function deleteCatalog(){
  let payload = {}
	payload['catalog_id'] = delete_catalog.value.id
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("delete_product_catalog",payload,token)
  if(data.request.status == 200){
    closeCatalogModal()
    if(data['data']['error']){
      let message = data['data']['error']['error_user_msg']
			showToast(message)
		} else {
      let message = "Selected catalogue is deleted"
			showToast(message)
      get_business_account(selected_phone_number.value)
		}
  } else {
      let message = "System error"
			showToast(message)
  }

}

function selectCatalog(catalog) {
  selected_catalog.value = catalog
  single_or_multiple.value = null
  products.value = []
}

function getDeleteCatalog(catalog){
  delete_catalog.value = catalog
}

function selectFunction(){
  if(single_or_multiple.value == "show_products"){
    showProducts(selected_catalog.value)
  }
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

function singleOrMutliple(uplaod_type){
  single_or_multiple.value = uplaod_type
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
  payload['additional_image_urls'] = additional_image_urls.value.map(item => item.url)
  payload['availability'] = availability.value
  payload['url'] = url.value
  payload['retailer_product_group_id'] = retailer_product_group_id.value
  payload['brand'] = brand.value
  payload['weight'] = weight.value
  payload['weight_unit'] = weight_unit.value
  console.log(payload)
  let data = await postRequest("upload_product",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      let message = "Product is successfully created"
      clearProductValue()
      showToast(message)
    }
  } else {
    console.log(data)
  }
}

function clearProductValue(){
  business_account_id.value = null
  selected_catalog.value = null
  retailer_id.value = null
  name.value = null
  description.value = null
  price.value = null
  sale_price.value = null
  currency.value = null
  image_url.value = null
  additional_image_urls.value = []
  availability.value = null
  url.value = null
  retailer_product_group_id.value = null
  brand.value = null
  weight.value = null
  weight_unit.value = null
  url_index.value = 1
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
      console.log(data)
      is_cart_enabled.value = data['data']['data'][0]['is_cart_enabled']
      is_catalog_visible.value = data['data']['data'][0]['is_catalog_visible']
		}
  }
}

function addImage(){
  additional_image_urls.value.push({'id':url_index.value,'url':''})
  url_index.value += 1
}

function deleteImage(image_id){
  const index = additional_image_urls.value.findIndex(item => item.id === image_id)
    if (index !== -1) {
      additional_image_urls.value.splice(index, 1)
    }
}

function selectProduct(product){
  update_additional_image_urls.value = []
  selected_product.value = product
  error_message.value = null
  if(selected_product.value.additional_image_urls){
    selected_product.value.additional_image_urls.split(',').forEach((element,index) => {
      update_additional_image_urls.value.push({"id":edit_url_index,"url":element})
      edit_url_index.value += 1
    });
  } else {
    console.log("no additional images")
  }
}

function addImageAtEdit(){
  update_additional_image_urls.value.push({"id":edit_url_index,"url":''})
  edit_url_index.value += 1
}

function deleteImageAtEdit(image_id){
  const index = update_additional_image_urls.value.findIndex(item => item.id === image_id)
    if (index !== -1) {
      update_additional_image_urls.value.splice(index, 1)
    }
}

async function editProduct(){
  selected_product.value.additional_image_urls = update_additional_image_urls.value.map(item => item.url)
  selected_product.value.waba_id = selected_waba_account.value
  selected_product.value.phone_number_id = selected_phone_number_id.value
  let response = await postRequest("edit_product",selected_product.value,token)
  if (response.data?.error) {
    //console.log("Error key exists:", response.data.error);
    error_message.value = response.data.error
  } else {
    console.log(response)
    showProducts(selected_catalog.value)
    closeModal()
    let message = "Product is edited"
		showToast(message)
  }
}

async function deleteProduct(product){
  let payload = {}
  payload['facebook_product_id'] = product.facebook_product_id
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("delete_product",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      let message = data['data']['error']['message']
			showToast(message)
		} else {
      let message = "Selected product is deleted"
			showToast(message)
      showProducts(selected_catalog.value)
		}
  } else {
      let message = "System error"
			showToast(message)
  }
}


function closeModal() {
  const closeButton = document.getElementById("closeModalButton");
  closeButton.click()
}

function closeCatalogModal() {
  const closeButton = document.getElementById("deleteCatalogModal");
  closeButton.click()
}


checkLogin()
checkWaba()

</script>

<style scoped>
#margin_10 {
  margin-top:10px;
  margin-bottom:10px;
  text-align: center;
}

</style>

<template>
  <div class="modal fade" id="modalLg3">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Delete Catalogue</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
            <div class="row">
               <div class="col-md-4">
                  <button type="button" class="btn btn-danger me-2" @click="deleteCatalog()">Confirm to delete</button>
                </div>
            </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLg2">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Product Details</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body" v-if="selected_product">
            <div class="row" id='margin_10'>
              <div class="col-md-6">
                <label>Name</label>
                <input type="text" class="form-control" placeholder="name" v-model="selected_product.name"/>
              </div>
              <div class="col-md-6">
                <label>Description</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" placeholder="product description" v-model="selected_product.description"></textarea>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <label>Currency</label>
                <v-select v-model="selected_product.currency" :options="currency_options" label="label" :reduce="loc => loc.value"></v-select>
              </div>
              <div class="col-md-3">
                <label>Availability</label>
                <v-select v-model="selected_product.availability" :options="availability_options" label="label" :reduce="loc => loc.value"></v-select>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <label>Price ($1 = 100)</label>
                <input type="number" class="form-control" placeholder="Price (100 = 1.00)" v-model="selected_product.price"/>
              </div>
              <div class="col-md-3">
                <label>Price ($1 = 100)</label>
                <input type="number" class="form-control" placeholder="Sale Price (100 = 1.00)" v-model="selected_product.sale_price"/>
              </div>
              
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <label>Url</label>
                <input type="text" class="form-control" placeholder="url" v-model="selected_product.url"/>
              </div>
              <div class="col-md-3">
                <label>Brand</label>
                <input type="text" class="form-control" placeholder="Brand" v-model="selected_product.brand"/>
              </div>
              <div class="col-md-3">
                <label>Weight</label>
                <input type="number" class="form-control" placeholder="Weight (kg)" v-model="selected_product.weight"/>
              </div>
              <div class="col-md-3">
                <label>Weight Unit</label>
                <v-select v-model="selected_product.weight_unit" :options="weight_options" label="label" :reduce="loc => loc.value"></v-select>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-6">
                <label>Image Url</label>
                <input type="text" class="form-control" placeholder="Product image" v-model="selected_product.image_url"/>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <button type="button" class="btn btn-yellow me-2" @click="addImageAtEdit"><i class="fas fa-lg fa-fw me-2 fa-plus"></i>Addtional images</button>
              </div>
            </div>
            
            <div class="row" id='margin_10' v-for="image in update_additional_image_urls">
              <div class="col-md-9">
                <input type="text" class="form-control" placeholder="" v-model="image.url"/>
              </div>
              <div class="col-md-3">
                <button type="button" class="btn btn-danger me-2" @click="deleteImageAtEdit(image.id)">Delete</button>
              </div>
            </div>
            
            <div class="row" id="marin_top_10">
              <div class="col-md-6">
                <button type="button" class="btn btn-warning me-2" @click="editProduct">Edit</button>
              </div>
            </div>

            <div class="row" v-if="error_message" id="marin_top_10">
              <div class="alert alert-warning">
                <strong>Ohh !</strong> {{error_message}}
              </div>
            </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="closeModalButton">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLg">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Cart Setting</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="col-md-12">
              <div class="row">
                <div class="col-md-12">
                  <fragment>
                    <button type="button" class="btn btn-warning me-2" @click="update_cart_status('false')" v-if="is_cart_enabled"><i class="fas fa-lg fa-fw me-2 fa-edit"></i> Unable cart</button>
                    <button type="button" class="btn btn-warning me-2" @click="update_cart_status('true')" v-else><i class="fas fa-lg fa-fw me-2 fa-edit"></i> Enable cart</button>
                  </fragment>
                  <fragment>
                    <button type="button" class="btn btn-warning me-2" @click="visible_catalog_icon('false')" v-if="is_catalog_visible"><i class="fas fa-lg fa-fw me-2 fa-edit"></i> Cart icon invisible</button>
                    <button type="button" class="btn btn-warning me-2" @click="visible_catalog_icon('true')" v-else><i class="fas fa-lg fa-fw me-2 fa-edit"></i> Cart icon visible</button>
                  </fragment>
                  <button type="button" class="btn btn-info me-2" @click="copyLink(catalog_link)"> <i class="fas fa-lg fa-fw me-2 fa-copy"></i> Copy link</button>
                </div>
              </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

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
    <card-body class="pb-2" style="border-bottom:1px solid #ccc;">
      <div class="row">
        <div class="col-md-6">
          <div class="row">
            <div class="flex-fill fw-bold fs-16px">Select phone number</div>
          </div>
          <div class="row" id="marin_top_10">
            <div class="col-md-6">
              <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
            </div>
          </div>
          <div class="row" id="marin_top_10" v-if="select_account">
            <div class="col-md-6">
              <button type="button" class="btn btn-yellow me-2" data-bs-toggle="modal" data-bs-target="#modalLg">Cart setting</button>
            </div>
          </div>
        </div>
      </div>
    </card-body>
      
    <div class="row">
      <div class="col-md-3" v-if="select_account">
        <card-body class="pb-2" style="border-bottom:1px solid #ccc;border-right:1px solid #ccc;">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Catalog</div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <input type="text" class="form-control" placeholder="Catalog Name" v-model="catalog_name">
            </div>
            <div class="col-md-6">
              <button type="button" class="btn btn-teal me-2" @click="addCatalog">Create</button>
            </div>
          </div>
        </card-body>
        
        <fragment v-for="catalog in catalogs" v-if="catalogs.length > 0">
          <card-body class="pb-2" style="border-bottom:1px solid #ccc;border-right:1px solid #ccc;">
            <div class="row" style="margin-bottom:10px;">
                <div class="col-md-12" style="margin-top:10px;">
                  <input type="text" class="form-control" placeholder="Title" v-model="catalog.name">
                </div>
              </div>
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-4">
                  <button type="button" class="btn btn-warning me-2" @click="editCatalog(catalog)">Edit</button>
                </div>
                <div class="col-md-4">
                  <button type="button" class="btn btn-yellow me-2" @click="selectCatalog(catalog)">Show</button>
                </div>
                <div class="col-md-4">
                  <button type="button" class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#modalLg3" @click="getDeleteCatalog(catalog)">Delete</button>
                </div>
              </div>
          </card-body>
        </fragment>
      </div>

      <div class="col-xl-9" v-if="selected_catalog">
        <card-body class="pb-2" style="border-bottom:1px solid #ccc;">
          <div class="flex-fill fw-bold fs-16px">{{selected_catalog.name}}</div>
          <div class="col-md-6" style="margin-top:10px;">
            <v-select v-model="single_or_multiple" :options="function_options" label="label" :reduce="loc => loc.value" @update:modelValue="selectFunction"></v-select>
          </div>
        </card-body>

        <card-body v-if="selected_catalog && single_or_multiple =='single'">
          <div class="row" id='margin_10'>
              <div class="col-md-3">
                <label>Id</label>
                <input type="text" class="form-control" placeholder="retailer_id" v-model="retailer_id"/>
              </div>
              <div class="col-md-3">
                <label>Name</label>
                <input type="text" class="form-control" placeholder="name" v-model="name"/>
              </div>
              <div class="col-md-3">
                <label>Description</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" placeholder="product description" v-model="description"></textarea>
              </div>
              <div class="col-md-3">
                <label>Group Id (Optional)</label>
                <input type="text" class="form-control" placeholder="retailer_product_group_id" v-model="retailer_product_group_id"/>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <label>Currency</label>
                <v-select v-model="currency" :options="currency_options" label="label" :reduce="loc => loc.value"></v-select>
              </div>
              <div class="col-md-3">
                <label>Price ($1 = 100)</label>
                <input type="number" class="form-control" placeholder="Price ($1 = 100)" v-model="price"/>
              </div>
              <div class="col-md-3">
                <label>Sale Price ($1 = 100)</label>
                <input type="number" class="form-control" placeholder="Sale Price ($1 = 100)" v-model="sale_price"/>
              </div>
              <div class="col-md-3">
                <label>Availability</label>
                <v-select v-model="availability" :options="availability_options" label="label" :reduce="loc => loc.value"></v-select>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-3">
                <label>Product Url</label>
                <input type="text" class="form-control" placeholder="url" v-model="url"/>
              </div>
              <div class="col-md-3">
                <label>Brand</label>
                <input type="text" class="form-control" placeholder="Brand" v-model="brand"/>
              </div>
              <div class="col-md-3">
                <label>Weight</label>
                <input type="number" class="form-control" placeholder="Weight (kg)" v-model="weight"/>
              </div>
              <div class="col-md-3">
                <label>Weight Unit</label>
                <v-select v-model="weight_unit" :options="weight_options" label="label" :reduce="loc => loc.value"></v-select>
              </div>
            </div>
            <div class="row" id='margin_10'>
              <div class="col-md-6">
                <label>Image Url</label>
                <input type="text" class="form-control" placeholder="Product image" v-model="image_url"/>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <button type="button" class="btn btn-yellow me-2" @click="addImage"><i class="fas fa-lg fa-fw me-2 fa-plus"></i>Addtional images</button>
              </div>
            </div>
            <div class="row" id='margin_10' v-for="image in additional_image_urls">
              <div class="col-md-6">
                <input type="text" class="form-control" placeholder="" v-model="image.url"/>
              </div>
              <div class="col-md-3">
                <button type="button" class="btn btn-danger me-2" @click="deleteImage(image.id)">Delete</button>
              </div>
            </div>
            
            <div class="row" style="margin-top:10px;">
              <div class="col-md-3">
                <button type="button" class="btn btn-teal me-2" @click="uploadProduct">Create product</button>
              </div>
            </div>
        </card-body>

        <card-body v-if="selected_catalog && single_or_multiple =='multiple'">
          <div class="row" id='margin_10'>
            <div class="col-md-8">
              <div class="row" style="margin-bottom:10px;text-align:justify;">
                <a href="/sample_template.csv">Download a template for batch importing products</a>
              </div>
              <div class="row" style="margin-bottom:10px;padding-left:10px;text-align:justify;">
                When set to false, the feed is treated as a replace feed. That means with every new incoming update, if we do not find the set of items created previously, they will be deleted.
              </div>
              <div class="row" style="margin-bottom:10px;padding-left:10px;text-align:justify;">
                When set to true, we create new items and update existing ones, but don't delete items from the feed. You only need to provide ID to update existing items. This reduces time to fetch and process your file.
              </div>
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-6">
                  <v-select v-model="uplaod_only" :options="update_options" label="label" :reduce="loc => loc.value"></v-select>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6"><input type="file" class="form-control" id="defaultFile" @change="onFileChange" accept=".csv" /></div>
              </div>
              
              <div class="row" style="margin-top:10px;text-align:left;">
                <div class="col-md-6"><button @click="uploadFile" class="btn btn-teal me-2" :disabled="!selectedFile">Upload</button></div>
              </div>
            </div>
          </div>
        </card-body>

        <card-body v-if="selected_catalog && single_or_multiple =='show_products'">
          <div class="row" v-if="products.length > 0">
            <div class="col-md-3" v-for="product in products">
              <div class="row">
                <img :src="product.image_url">
              </div>
              <div class="row" id="margin_10">
                <!-- <div class="col-md-6">
                  <button type="button" class="btn btn-teal me-2" data-bs-toggle="modal" data-bs-target="#modalLg2">Pick up</button>
                </div> -->
                <div class="col-md-6">
                  <button type="button" class="btn btn-yellow me-2" data-bs-toggle="modal" data-bs-target="#modalLg2" @click="selectProduct(product)">Show</button>
                </div>
                <div class="col-md-6">
                  <button type="button" class="btn btn-danger me-2" @click="deleteProduct(product)">Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div class="row" v-else>
            <div class="alert alert-warning">
              <strong>Ohh, No products !</strong> Please upload your products
            </div>
          </div>
        </card-body>
      </div>
    </div>


   
     
    <card-body class="pb-2" v-if="select_account && !business_account_id">
      <div class="alert alert-warning">
        <strong>Ohh, No business account!</strong> <a href="#" @click="go">Please connect your business account id</a>
      </div>
    </card-body>
  </card>
</template>

<style scoped>
.form-label {
  font-weight:bold;
}
#marin_top_10 {
  margin-top:10px;
}
</style>
