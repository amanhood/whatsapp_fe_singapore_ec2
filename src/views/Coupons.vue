<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest,deleteRequest, userRequestWithToken } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import moment from 'moment';
import readXlsxFile from 'read-excel-file'
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const userSession = useUserSessionStore();
const router = useRouter()


let username = ref(null)
let token = ref(null)
let role = ref(null)


let notification_message = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let select_account = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
let parent_id = ref(sessionStorage.getItem("id"))
let campaigns = ref([])
let selected_campaign = ref(null)
let coupons = ref([])
let selected_coupon = ref(null)
let coupon = ref({})
let coupon_types = [
        { id:"re-use",title: "Reusable" },
        { id:"one-time",title: "One-Time Only" },
    ]
let statues = [
    { id:true,title: "Active" },
    { id:false,title: "In-active" },
]
let selected_coupon_ids = ref([])
let imported_data = ref([])

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}

function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  selected_phone_number.value = select_account.value.value
  getCampaigns()
}

async function getCampaigns(){
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("get_campaigns",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = "Failed to get campaigns"
			showToast(message)
		} else {
            data['data']['campaigns'].forEach((item => {
                campaigns.value.push({"id":item.id,"title":item.name})
            }))
		}
    } else {
        let message = "Failed to get campaigns"
		showToast(message)
    }
}

async function selectCampaign(){
    let payload = {}
    payload['campaign_id'] = selected_campaign.value
    let data = await postRequest("get_coupons",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = "Failed to get coupons"
			showToast(message)
		} else {
            coupons.value = data['data']['coupons']
		}
    } else {
        let message = "Failed to get coupons"
		showToast(message)
    }
}

async function manageCoupon(){
    if(!coupon.value.code){
        let message = "Please input code"
        showToast(message)
        return
    }

    if(!coupon.value.title){
        let message = "Please input title"
        showToast(message)
        return
    }

    if(!coupon.value.content){
        let message = "Please input content"
        showToast(message)
        return
    }

    if(!coupon.value.coupon_type){
        let message = "Please input coupon type"
        showToast(message)
        return
    }

    if (coupon.value.redeem_url) {
        // only validate when user entered something
        if (!coupon.value.redeem_url.startsWith("https://")) {
            showToast("Redeem URL must start with https://");
            return;
        }
    }

    if (coupon.value.is_active === null || coupon.value.is_active === undefined) {
        showToast("Please input status");
        return;
    }

    if(selected_coupon.value){
        let payload = {}
        payload['coupon'] = coupon.value
        payload['campaign_id'] = selected_campaign.value
        let data = await postRequest("edit_coupon",payload,token)
        if(data.request.status == 200){
            let error_data = JSON.parse(data['data'])
            if(error_data['error']){
                let message = error_data['error']['message']
                showToast(message)
                selectCampaign()
            } else {
                getCampaigns()
            }
        } else {
            let message = "Failed to update coupon"
            showToast(message)
        }
    } else {
        let payload = {}
        payload['coupon'] = coupon.value
        payload['campaign_id'] = selected_campaign.value
        let data = await postRequest("create_coupon",payload,token)
        if(data.request.status == 200){
            let error_data = JSON.parse(data['data'])
            if(error_data['error']){
                let message = error_data['error']['message']
                showToast(message)
            } else {
                selectCampaign()
            }
        } else {
            let message = "Failed to create coupon"
            showToast(message)
        }
    }
}

function createCoupon(){
    coupon.value = {}
    selected_coupon.value = null
}


function editCoupon(s_coupon){
    coupon.value = s_coupon
    selected_coupon.value = s_coupon
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if(role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

function checkStatus(status){
    if(status == true){
        return "Active"
    } else {
        return "In-active"
    }
}

function checkType(coupon_type){
    if(coupon_type == "re-use"){
        return "Reusable"
    } else {
        return "One-Time Only"
    }
}

function checkDelivered(is_delivered){
    if(is_delivered == true){
        return "Delivered"
    } else {
        return "Not Delivered"
    }
}

function deliveryDateTime(delivery_time){
  return moment(delivery_time).format('dddd, MMMM DD, YYYY HH:mm:ss');
}

function toggleSelectAll(event) {
  const checked = event.target.checked

  if (checked) {
    // select all coupon ids
    selected_coupon_ids.value = coupons.value
      .filter(coupon => coupon.is_delivered !== true)   // exclude delivered
      .map(coupon => coupon.id)
  } else {
    selected_coupon_ids.value = []
  }
  console.log(selected_coupon_ids.value)
}

function toggleSingle(id) {
  if (selected_coupon_ids.value.includes(id)) {
    selected_coupon_ids.value = selected_coupon_ids.value.filter(x => x !== id)
  } else {
    selected_coupon_ids.value.push(id)
  }
}

async function deleteCoupon(coupon){
    let payload = {}
    payload['coupon_id'] = coupon.id
    let data = await postRequest("delete_coupon",payload,token)
    if(data.request.status == 200){
        let error_data = JSON.parse(data['data'])
        if(error_data['error']){
            let message = error_data['error']['message']
            showToast(message)
        } else {
            selectCampaign()
            console.log(coupons.value)
        }
    } else {
        let message = "Failed to delete coupon"
        showToast(message)
    }
}

async function deleteSelectedCoupons(){
    let payload = {}
    payload['coupon_ids'] = selected_coupon_ids.value
    let data = await postRequest("delete_selected_coupons",payload,token)
    if(data.request.status == 200){
        let error_data = JSON.parse(data['data'])
        if(error_data['error']){
            let message = error_data['error']['message']
            showToast(message)
        } else {
            selectCampaign()
            selected_coupon_ids.value = []
        }
    } else {
        let message = "Failed to delete coupon"
        showToast(message)
    }
}

async function updateStatus(coupon_id,is_active){
    let payload = {}
    payload['coupon_id'] = coupon_id
    payload['is_active'] = is_active
    let data = await postRequest("update_coupon_status",payload,token)
    if(data.request.status == 200){
		let message = "Coupon status is changed"
        showToast(message)
        selectCampaign()
    } else {
        let message = "Failed to change status"
        showToast(message)
    }
}

function uploadExcel(event) {
  let xlsxFile = event.target.files ? event.target.files[0] : null;
  if (!xlsxFile) {
    console.warn("No file selected");
    return;
  }

  readXlsxFile(xlsxFile)
    .then((rows) => {
      if (!rows.length || rows.length < 2) {
        console.warn("Excel file does not contain enough rows.");
        return;
      }

      const headers = rows[0];
      const rowData = rows
        .slice(1)
        .filter((row) => row.some((cell) => cell != null));

      const result = rowData.map((row) =>
        headers.reduce((obj, header, index) => {
          let cell = row[index];
          obj[header] = cell;
          return obj;
        }, {})
      );

      // -----------------------------
      // 🔥 VALIDATION STARTS HERE
      // -----------------------------

      const existingCodes = new Set(
        (coupons.value || []).map(c =>
          String(c.code).trim().toLowerCase()
        )
      );

      // ✅ Count existing re-use coupons
      const existingReusableCount = (coupons.value || []).filter(
        c => c.coupon_type === "re-use"
      ).length;

      // Track codes in the uploaded file to catch duplicates inside file
      const fileCodes = new Set();

      // Track how many re-use in the uploaded file
      let newReusableCount = 0;

        for (let i = 0; i < result.length; i++) {
            const row = result[i];
            const rowNumber = i + 2; // Excel row number (since row[0] is header)

            // --- 0. code required ---
            if (row.code === null || row.code === undefined || row.code === "") {
                showToast(`Row ${rowNumber}: code is required.`);
                event.target.value = null;
                return;
            }

            const codeStr = String(row.code).trim().toLowerCase();

            // --- 0.1 duplicate inside file ---
            if (fileCodes.has(codeStr)) {
                showToast(`Row ${rowNumber}: duplicated code in Excel file: "${row.code}".`);
                event.target.value = null;
                return;
            }
            fileCodes.add(codeStr);

            // --- 0.2 already exists in existing coupons (DB for this page) ---
            if (existingCodes.has(codeStr)) {
                showToast(`Row ${rowNumber}: code "${row.code}" already exists.`);
                event.target.value = null;
                return;
            }

            // 1. redeem_url must start with https://
            if (!row.redeem_url || !String(row.redeem_url).startsWith("https://")) {
                showToast(`Row ${rowNumber}: redeem_url must contain "https://".`);
                event.target.value = null;
                return;
            }

            // 2. coupon_type must be re-use or one-time
            if (!["re-use", "one-time"].includes(row.coupon_type)) {
                showToast(`Row ${rowNumber}: coupon_type must be "re-use" or "one-time".`);
                event.target.value = null;
                return;
            }

            // 🔥 Count new re-use coupons
            if (row.coupon_type === "re-use") {
                newReusableCount += 1;
            }

            // 3. is_delivered must be boolean
            if (typeof row.is_delivered !== "boolean") {
                showToast(`Row ${rowNumber}: is_delivered must be TRUE or FALSE.`);
                event.target.value = null;
                return;
            }

            // 4. is_active must be boolean
            if (typeof row.is_active !== "boolean") {
                showToast(`Row ${rowNumber}: is_active must be TRUE or FALSE.`);
                event.target.value = null;
                return;
            }
        }

      // After the loop: enforce only one "re-use" total (existing + new)
        if (existingReusableCount + newReusableCount > 1) {
            if (existingReusableCount >= 1) {
                event.target.value = null;
                showToast("This campaign already has a reusable coupon. You cannot add another one.");
            } else {
                showToast("You can only create one reusable coupon per campaign.");
            }
            return;
        }
      // -----------------------------
      // 🔥 VALIDATION PASSED
      // -----------------------------
      imported_data.value = result;
      console.log("Imported:", imported_data.value);
    })
    .catch((err) => {
      event.target.value = null;
      console.error("Error reading Excel:", err);
      showToast("Error reading Excel");
    });
}

async function uploadCoupons(){
    let payload = {}
    payload['coupons'] = imported_data.value
    payload['campaign'] = selected_campaign.value
    let data = await postRequest("batch_upload_coupons",payload,token)
    if(data.request.status == 200){
		selectCampaign()
    } else {
        let message = "Failed to upload coupons"
        showToast(message)
    }
}

checkLogin()
checkWaba()


</script>

<style>

.toasts-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999; /* make this higher than modals/popups */
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

    <div class="modal fade" id="modalLg">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title" v-if="selected_coupon">Edit coupon</h5>
                <h5 class="modal-title" v-else>Create coupon</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    <div class="row">
                        <div class="col-xl-6">
                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Code</label>
                                <input type="text" class="form-control" placeholder="" v-model="coupon.code"/>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                                <input type="text" class="form-control" placeholder="" v-model="coupon.title"/>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Content</label>
                                <textarea
                                    v-model="coupon.content"
                                    class="form-control"
                                ></textarea>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Redeem Url</label>
                                <input type="text" class="form-control" placeholder="" v-model="coupon.redeem_url"/>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Type</label>
                                <v-select v-model="coupon.coupon_type" :options="coupon_types" label="title" :reduce="option => option.id"></v-select>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Status</label>
                                <v-select v-model="coupon.is_active" :options="statues" label="title" :reduce="option => option.id"></v-select>
                            </div>
                            
                            <div class="form-group mb-3" v-if="selected_coupon">
                                <button type="button" class="btn btn-yellow me-2" @click="manageCoupon">Edit</button>
                            </div>

                            <div class="form-group mb-3" v-else>
                                <button type="button" class="btn btn-teal me-2" @click="manageCoupon">Create</button>
                            </div>
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
                <h5 class="modal-title">Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    <div class="row">
                        <div class="col-xl-6">
                            <div class="form-group mb-3">
                                <button type="button" class="btn btn-danger me-2" @click="deleteSelectedCoupons">Confirm to delete</button>
                            </div>
                        </div>
                    </div>
                    
                </div>
                
                <div class="modal-footer">
                <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalLg3">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title">Batch import coupons</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                        <input type="file" class="form-control" id="defaultFile" @change="uploadExcel" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"/>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                        <button type="button" class="btn btn-primary mb-1 me-1" @click="uploadCoupons">Upload</button>
                        </div>
                    </div>
                    
                </div>
                
                <div class="modal-footer">
                <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
                </div>
            </div>
        </div>
    </div>

	<card>
        <card-body class="pb-2" style="border-bottom:1px solid #ccc;">
            <div class="row">
                <div class="col-md-6">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="row">
                                <div class="flex-fill fw-bold fs-16px">Whatsapp number</div>
                            </div>
                            <div class="row" id="marin_top_10">
                                <div class="col-md-12">
                                <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4" v-if="selected_phone_number_id">
                            <div class="row">
                                <div class="flex-fill fw-bold fs-16px">Campaigns</div>
                            </div>
                            <div class="row" id="marin_top_10">
                                <div class="col-md-12">
                                <v-select v-model="selected_campaign" :options="campaigns" label="title" :reduce="option => option.id" @update:modelValue="selectCampaign"></v-select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </card-body>
		<div class="tab-content p-4" v-if="selected_waba_account">
			<div class="tab-pane fade show active" id="allTab">
                
				<div class="row" v-if="selected_campaign">
                    <div class="col-xl-2">
                        <div class="mb-3">
                            <button type="button" class="btn btn-teal me-2" data-bs-toggle="modal" data-bs-target="#modalLg" @click="createCoupon()">Create coupon</button>
                        </div>
                    </div>
                    <div class="col-xl-2">
                        <div class="mb-3">
                            <button type="button" class="btn btn-teal me-2" data-bs-toggle="modal" data-bs-target="#modalLg3">Import coupons</button>
                        </div>
                    </div>
                    <div class="col-xl-2" v-if="selected_coupon_ids.length > 0">
                        <div class="mb-3">
                            <button type="button" class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#modalLg2">Delete selected coupons</button>
                        </div>
                    </div>
                    
                </div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
                                <th class="border-top-0 pt-0 pb-2">
                                    <input type="checkbox" @change="toggleSelectAll" />
                                </th>
								<th class="border-top-0 pt-0 pb-2">Code</th>
                                <th class="border-top-0 pt-0 pb-2">Title</th>
								<th class="border-top-0 pt-0 pb-2">Content</th>
                                <th class="border-top-0 pt-0 pb-2">Redeem url</th>
                                <th class="border-top-0 pt-0 pb-2">Type</th>
                                <th class="border-top-0 pt-0 pb-2">Delivered ?</th>
                                <th class="border-top-0 pt-0 pb-2">Active ?</th>
                                <th class="border-top-0 pt-0 pb-2">Edit</th>
                                <th class="border-top-0 pt-0 pb-2">Delete</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="coupon in coupons" :key="coupon.id" v-if="coupons.length > 0"> 
                                <td class="align-middle">
                                    <input
                                        type="checkbox"
                                        :checked="selected_coupon_ids.includes(coupon.id)"
                                        :disabled="coupon.is_delivered === true"
                                        @change="toggleSingle(coupon.id)"
                                    />
                                </td>        
                                <td class="align-middle">{{ coupon['code'] }}</td>
                                <td class="align-middle">{{ coupon['title'] }}</td>
                                <td class="align-middle">{{ coupon['content'] }}</td>
                                <td class="align-middle">{{ coupon['redeem_url'] }}</td>
                                <td class="align-middle">{{ checkType(coupon['coupon_type']) }}</td>
                                <td class="align-middle">{{ checkDelivered(coupon['is_delivered']) }}</td>
                                <td class="align-middle">
                                    <div class="form-check form-switch"><input type="checkbox" class="form-check-input" id="customSwitch1" @click="updateStatus(coupon['id'],!coupon['is_active'])" v-model="coupon.is_active"></div>
                                </td>
                                <td class="align-middle"><button type="button" data-bs-toggle="modal" data-bs-target="#modalLg" @click="editCoupon(coupon)" class="btn btn-yellow me-2">Edit</button></td>
                                <td class="align-middle" v-if="coupon.is_delivered == false"><button type="button" @click="deleteCoupon(coupon)" class="btn btn-danger me-2">Delete</button></td>
                                <td class="align-middle" v-else></td>
                            </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
