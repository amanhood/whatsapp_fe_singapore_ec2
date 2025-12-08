<script setup>
    import { useUserSessionStore } from '@/stores/user-session';
    import { ref } from 'vue'
    import { getRequest,postRequest,deleteRequest,putRequest } from '../composables/api.js'
    import { exportResponsesToExcel } from '../composables/coupon_delivery_excel.js'
    import { Toast } from 'bootstrap';
    import { useRouter, RouterLink } from 'vue-router';
    import datepicker from '@/assets/components/plugins/Datepicker.vue';
    import 'vue-select/dist/vue-select.css';
    import moment from 'moment';
    import * as XLSX from 'xlsx';
    import { saveAs } from 'file-saver';
    import { FileQuestionMark,SpellCheck } from 'lucide-vue-next'
    
    const router = useRouter()
    
    let username = ref(null)
    let token = ref(null)
    let role = ref(null)
    let notification_message = ref(null)
    let start_date = ref(null)
    let end_date = ref(null)
    let forms = ref([])
    let coupon_records = ref([])
    let selected_form = ref(null)
    
    token = sessionStorage.getItem("token")
    username = sessionStorage.getItem("username")
    role.value = sessionStorage.getItem("role")
    
    async function getForms(){
        let response = await getRequest("get_landing_pages",token)
        if(response['status'] == 200){
            response['data']['landing_pages'].forEach((item, i) => {
                forms.value.push({'id':item.id,'value':item.title,})
            });
        } else {
            let notification_message = "Failed to get forms"
            showToast(notification_message)
        }
    }
    
    function checkLogin(){
        if(!token){
            router.push('/page/login');
        } else {
            if (role.value != 'parent'){
                router.push('/page/login');
            } else {
                getForms()
            }
        }
    }
    
    
    function showToast(response_message) {
      //event.preventDefault();
      var toast = new Toast(document.getElementById('toast-1'));
      notification_message.value = response_message
      toast.show();
    }
    
    async function getCouponReport(){
        if (!start_date.value || !end_date.value) {
            let notification_message = "Start date and end date cannot be null"
            showToast(notification_message)
            return
        }
        if (end_date.value < start_date.value) {
            let notification_message = "End date cannot be earlier than start date."
            showToast(notification_message)
            return
        }
        let payload = {}
        payload['start_date'] = start_date.value
        payload['end_date'] = end_date.value
        payload['form_id'] = selected_form.value.id
        let response = await postRequest("get_coupon_report",payload,token)
        if(response['status'] == 200){
            coupon_records.value = response['data']['coupon_records']
        } else {
            let notification_message = "Failed to get coupon report"
            showToast(notification_message)
        }
    }
    
    function getDateTime(date_type){
      if(date_type == 'start'){
        start_date.value = convertDateTime(start_date.value)
      } else if(date_type == 'end'){
        end_date.value = convertDateTime(end_date.value)
      }
    }
    
    function convertDateTime(dateStr){
      const date = new Date(dateStr);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
      const dd = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      return formattedDate
    }
    
    
    function deliveryDateTime(delivery_time){
      return moment(delivery_time).format('dddd, MMMM DD, YYYY HH:mm:ss');
    }
    
    function checkStatus(status){
      if(status == true){
        return "Delivered"
      } else {
        return "Failed"
      }
    }
    
    function onExport() {
      // works with a single record or an array of records
      exportResponsesToExcel(coupon_records.value, `responses-${new Date().toISOString().slice(0,10)}.xlsx`);
    }
    
    
    checkLogin()
    
    
    </script>
    
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
          <div class="row">
            <div class="col-md-12">
              <div class="row" style="margin-bottom:10px;">
                <div class="flex-fill fw-bold fs-16px">Select Landing Page</div>
              </div>
              <div class="row">
                <div class="col-md-3">
                  <v-select v-model="selected_form" :options="forms" label="value"></v-select>
                </div>
                <div class="col-md-3" v-if="selected_form">
                  <datepicker v-model="start_date" @update:model-value="getDateTime('start')"/>
                </div>
                <div class="col-md-3" v-if="selected_form">
                  <datepicker v-model="end_date" @update:model-value="getDateTime('end')"/>
                </div>
                <div class="col-md-3" v-if="selected_form">
                  <button type="button" class="btn btn-yellow mb-1 me-1" @click="getCouponReport">Get coupon report</button>
                </div>    
              </div>
            </div>
          </div>
        </card-body>
        <card-body class="pb-2" v-if="coupon_records.length > 0">
          <div class="row">
            <div class="col-md-12">
              <div class="row">
                <div class="col-md-3">
                  <button type="button" class="btn btn-teal mb-1 me-1" @click="onExport">Export to excel</button>
                </div>
              </div>
            </div>
          </div>
        </card-body>
        <hr>
        <card-body>
            <div class="table-responsive">
                <table class="table table-hover text-nowrap">
                    <thead>
                        <tr>
                            <th class="border-top-0 pt-0 pb-2">Form</th>
                            <th class="border-top-0 pt-0 pb-2">Campaign</th>
                            <th class="border-top-0 pt-0 pb-2">Coupon</th>
                            <th class="border-top-0 pt-0 pb-2">Recipients</th>
                            <th class="border-top-0 pt-0 pb-2">Delivery time</th>
                            <th class="border-top-0 pt-0 pb-2">Delivery status</th>
                            <th class="border-top-0 pt-0 pb-2">Failed reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="record in coupon_records">
                            <td class="align-middle">{{ record.form_name }}</td>
                            <td class="align-middle">{{ record.campaign_name }}</td>
                            <td class="align-middle">{{ record.coupon_name }}</td>
                            <td class="align-middle">{{ record.recipient }}</td>
                            <td class="align-middle">{{ deliveryDateTime(record.delivered_at) }}</td>
                            <td class="align-middle">{{ checkStatus(record.status) }}</td>
                            <td class="align-middle">{{ record.failed_reason }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </card-body>
    
      </card>
    </template>
    
    <style scoped>
    .form-label {
      font-weight:bold;
    }
    #marin_top_20 {
      margin-top:20px;
    }
    </style>
    