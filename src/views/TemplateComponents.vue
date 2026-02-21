<script setup>
import { useAppOptionStore } from '@/stores/app-option';
import { ref,watch,onMounted } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import { Toast } from 'bootstrap';
import { fileProcess } from '../composables/file_process.js'
import readXlsxFile from 'read-excel-file'
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';

//const appOption = useAppOptionStore();
const props = defineProps(['component','template_name','template_category','waba_id','phone_number_id',"template_type","business_account_id","products"])
onMounted(() => {
  // console.log(props.component);
  console.log(props.template_type);
  // console.log(props.template_category)
});


let spin_loading = ref(false)
let customImageMaxSize = ref(3)
let uploaded_file = ref(null)
let file_name = ref(null)
let file_length = ref(null)
let file_type = ref(null)
let header_text = ref('')
let body_variables = ref([])
let limited_time_offer_text = ref(null)
let offer_code = ref(null)
let url_variables = ref([])
let recipient = ref(null)
let token = ref(null)
let contacts = ref([])
let selected_product = ref(null)
let update_additional_image_urls = ref([])
let edit_url_index = ref(1)
let thumbnail_product_id = ref(null)
let sections = ref([])
let number_of_section = ref(1)
let imported_data = ref(null);
let schedule_time = ref(null)
const minDate = new Date()

const disableDates = (date) => {
  const now = new Date()
  const d = new Date(date)

  // Compare just date parts
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return dateOnly.getTime() < todayOnly.getTime()
}

const validateTime = (selected) => {
  if (!schedule_time) return
// Ensure we are working with a Date object
  const selectedDate = new Date(schedule_time.value)
  const now = new Date()

  // Check if selected date is today
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate()

  if (isToday) {
    // Must be at least 15 minutes later
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000)
    if (selectedDate.getTime() < fifteenMinutesLater.getTime()) {
      let notification_message = "Please select a time at least 15 minutes later than now."
      emit('showtoast',notification_message)
      schedule_time.value = null
    }
  } 
}

token = sessionStorage.getItem("token")
const emit = defineEmits(["showtoast"])

function getDateTime(){
  limited_time_offer_text.value = Date.parse(limited_time_offer_text.value)
}

function timeConverter(epoch){
  var time = new Date(parseInt(epoch))
  return time;
}

function convertYMDHMS(sending_time){
  const date = new Date(sending_time);
  // Helper to pad numbers with leading zeros
  const pad = (n) => n.toString().padStart(2, '0');
  // Extract parts
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1); // getMonth() is zero-based
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  // Combine to format
  const formatted = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  return formatted
}

function restrictSpecialChars() {
  let badchrs = /[$%\^]/;
  if(badchrs.test(offer_code.value)) {
    let message = "$ or % or ^ are not allowed to use"
    emit('showtoast',message)
  }
}


async function uploadFile(event) {
  try {
    let data = await fileProcess(event);
    file_type.value = data.file_type
    file_name.value = data.file_name
    uploaded_file.value = data.file// Again, assuming fileProcess is adjusted to resolve with data
  } catch (error) {
    console.error("Error processing file:", error);
  }
}


async function preview(){
  spin_loading.value = true
  if(recipient.value){
    let payload = {}
    payload['waba_id'] = props.waba_id
    payload['phone_number_id'] = props.phone_number_id
    payload['template_type'] = "normal"
    props.component.forEach((item) => {
      if(item.type == 'LIMITED_TIME_OFFER'){
        payload['template_type'] = 'limited_time_offer'
      }
    })
    if(props.template_category == 'UTILITY'){
        payload['template_type'] = 'utility'
    }
    payload['uploaded_file'] = uploaded_file.value
    payload['file_name'] = file_name.value
    payload['file_type'] = file_type.value
    payload['header_text'] = header_text.value
    let variables = body_variables.value.length > 0
    ? body_variables.value
        .map(item => item.value)
        .filter(value => value !== null && value !== undefined) // filter out null or undefined
    : [];
    payload['body_variables'] = variables
    payload['limited_time_offer'] = limited_time_offer_text.value
    payload['offer_code'] = offer_code.value
    let link_variables = url_variables.value.length > 0
    ? url_variables.value
        .map(item => item.value)
        .filter(value => value !== null && value !== undefined) // filter out null or undefined
    : [];
    payload['url_variables'] = link_variables
    payload['recipient'] = recipient.value
    payload['components'] = props.component
    payload['template_name'] = props.template_name
    payload['thumbnail_product_id'] = thumbnail_product_id.value
    payload['sections'] = sections.value
    let data = await postRequest("send_ltomessage",payload,token)
    if(data.request.status == 200){
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      console.log(data)
    }
  } else {
    let notification_message = "No Recipient"
    emit('showtoast',notification_message)
  }
  spin_loading.value = false
}

async function sendMultiple(){
  if(schedule_time.value){
    spin_loading.value = true;
    const payload = {
      waba_id: props.waba_id,
      phone_number_id: props.phone_number_id,
      template_type: props.template_category === 'UTILITY' ? 'utility' : 'normal',
      template_name: props.template_name,
      components: props.component,
      thumbnail_product_id:thumbnail_product_id.value,
      sections:sections.value
    };

    if(props.template_type == 'specific_products'){
      if (!thumbnail_product_id || sections.value.length == 0){
        spin_loading.value = false;
        let notification_message = "No cover thumbnail and sections are existed, please select cover thumbnail of catalog and create sections"
        emit('showtoast',notification_message)
        return 
      }
    }

    if(props.template_type == 'limited_time_offer'){
      if(limited_time_offer_text.value){
        const inputDate = new Date(limited_time_offer_text.value);
        const tomorrow = new Date();
        // Reset today's time to 00:00:00 for accurate comparison
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (inputDate < tomorrow) {
          spin_loading.value = false;
          let notification_message = "The expiry date of promotion is earlier than or euqal today"
          emit('showtoast',notification_message)
          return 
        }
      } 
    } 

    const message_data = [];
    for (let index = 0; index < imported_data.value.length; index++) {
      const data = imported_data.value[index];

      if (!data.contact_phone_number) {
        emit('showtoast', `Missing contact phone number at row ${index + 1}`);
        spin_loading.value = false;
        return; // ✅ this exits the entire async function
      }

      const message = {
        recipient: data.contact_phone_number
      }
      props.component.forEach((item) => {
        if(item.type == 'LIMITED_TIME_OFFER'){
          payload['template_type'] = 'limited_time_offer'
          payload['limited_time_offer'] = limited_time_offer_text.value
          //check the coupon code
        }
        if(item.type == 'BUTTONS'){
          item.buttons.forEach((button)=>{
            if(button.type == 'MPM'){
              // template with products
              message['thumbnail_product_id'] = thumbnail_product_id.value
              message['sections'] = sections.value
              payload['template_type'] = 'multiple_products'
            }
            if(button.type == 'CATALOG'){
              // template with products
              message['thumbnail_product_id'] = thumbnail_product_id.value
              message['sections'] = sections.value
              payload['template_type'] = 'catalog_products'
            }
            if(button.type == 'URL'){
              // check url contain variable ? 
              if (Array.isArray(button.example) && button.example.length > 0) {
                // check any url variable at excel
                let link_variables = []
                const data_url = String(data.url);
                if (data_url.trim() !== ''){
                  link_variables.push(data_url)
                  message['url_variables'] = link_variables
                } else {
                  // if no header text existed at excel , use header_text input from web
                  link_variables = url_variables.value.length > 0
                  ? url_variables.value
                      .map(item => item.value)
                      .filter(value => value !== null && value !== undefined) // filter out null or undefined
                  : [];
                  message['url_variables'] = link_variables
                }
              }
            }
            if(button.type == 'COPY_CODE'){
              if ('coupon' in data && data.coupon) {
                message['offer_code'] = data.coupon
              } else if (offer_code.value) {
                message['offer_code'] = offer_code.value
              } else {
                message['offer_code'] = button.example[0]
              }
            }
          })
        }
        if(item.type == 'HEADER'){
          // check header is image or text
          if(item.format == 'IMAGE' || item.format == 'VIDEO' || item.format == 'DOCUMENT'){
            // check upload file existed ?
            payload['uploaded_file'] = uploaded_file.value
            payload['file_name'] = file_name.value
            payload['file_type'] = file_type.value
          } else {
            // check any variable at header ?
            if (item.example && 'header_text' in item.example) {
              // check any header text is provided at excel
              // change number to string for header
              data.header_01 = data.header_01.toString()
              if (typeof data.header_01 === 'string' && data.header_01.trim() !== ''){
                message['header_text'] = data.header_01
              } else {
                // if no header text existed at excel , use header_text input from web
                message['header_text'] = header_text.value
              }
            } 
          }
        }
        if(item.type == 'BODY'){
          // check any variable and how many variables 
          if (item.example && Array.isArray(item.example.body_text)) {
            const count = item.example.body_text[0].length;
            // Count keys that start with 'body_'
            const bodyFieldsCount = Object.keys(data).filter(key => key.startsWith('body_')).length;
            if (count == bodyFieldsCount){
              const body_variables = Object.keys(data)
              .filter(key => key.startsWith('body_'))
              .sort((a, b) => {
                const numA = parseInt(a.split('_')[1]);
                const numB = parseInt(b.split('_')[1]);
                return numA - numB;
              })
              .map(key => data[key]);
              message['body_variables'] = body_variables
            } else {
              let notification_message = "Missing variables at body"
              emit('showtoast',notification_message)
            }
          } else {
            console.log("example or body_text of body does not exist.");
          }
        }
      })
      message_data.push(message);
    }
    payload.message_data = message_data;
    console.log(payload)
    payload['schedule_time'] = convertYMDHMS(schedule_time.value)
    payload['token'] = token
    await send_to_background_task(payload, token);
    spin_loading.value = false;
  } else {
    let notification_message = "Please set your sending schedule"
    emit('showtoast',notification_message)
  }
  
}

async function send_to_background_task(payload,token){
    //let data = await postRequest("bulk_message",payload,token)
    let data = await postRequest("save_scheduled_background_jobs",payload,token)
    if(data.request.status == 200){
      let notification_message = "messages will be scheduled to send to recipients"
      emit('showtoast',notification_message)
    } else {
      console.log(data)
    }
}

function getComponentName(item){
  if(item == 'HEADER'){
    return "Header";
  } else if (item == 'BODY') {
    return "Body";
  } else if (item == 'LIMITED_TIME_OFFER'){
    return "Expiry date and time of special offer"
  } else if (item == 'FOOTER'){
    return "Footer";
  } else if (item == 'BUTTONS'){
    return "Buttons";
  }
}

function uploadExcel(event) {
  let xlsxFile = event.target.files ? event.target.files[0] : null;
  if (!xlsxFile) {
    console.warn("No file selected");
    return;
  }
  readXlsxFile(xlsxFile).then((rows) => {
    if (!rows.length || rows.length < 2) {
      console.warn('Excel file does not contain enough rows.')
      return
    }
    const headers = rows[0]
    const rowData = rows.slice(1).filter(row => row.some(cell => cell != null))
    const result = rowData.map(row =>
      headers.reduce((obj, header, index) => {
        let cell = row[index];

        // Check if cell is a Date object and convert to YYYY-MM-DD string
        if (cell instanceof Date) {
          const year = cell.getFullYear();
          const month = String(cell.getMonth() + 1).padStart(2, '0');
          const day = String(cell.getDate()).padStart(2, '0');
          cell = `${year}-${month}-${day}`;
        }

        obj[header] = cell;
        return obj;
      }, {})
    )
    imported_data.value = result
  }).catch((err) => {
    console.error('Error reading Excel:', err)
  })
  
}

function updateBodyVariables(){
  props.component.forEach((item, i) => {
    if(item.type == 'BODY'){
      if(item.example){
        item.example.body_text[0].forEach((bt, i) => {
          body_variables.value.push({'value':null})
        });
      }
    } else if(item.type == 'BUTTONS'){
      item.buttons.forEach((button, i) => {
        if(button.type == 'URL' && button.example){
          url_variables.value.push({'value':null})
        }
      });

    }
  });
}

function displayProduct(product){
  update_additional_image_urls.value = []
  selected_product.value = product
  if(selected_product.value.additional_image_urls){
    selected_product.value.additional_image_urls.split(',').forEach((element,index) => {
      update_additional_image_urls.value.push({"id":edit_url_index,"url":element})
      edit_url_index.value += 1
    });
    console.log(update_additional_image_urls.value)
  } else {
    console.log("no additional images")
  }
}

function makeasCoverPhoto(product){
  thumbnail_product_id.value = product.retailer_id
}

function addSection(){
  if(sections.value.length < 11){
    sections.value.push({
      'id':number_of_section.value,
      'title':null,
      'product_items':[],
      'div_name':number_of_section.value.toString() + "_products"
    })
    number_of_section.value += 1
  } else {
    let message = "More than 10 sections are not allowed in Multiple Products template"
    emit('showtoast',message)
  }
}

function deleteSection(section_id){
  const index = sections.value.findIndex(item => item.id === section_id)
  //console.log(index)
  if (index !== -1) {
    sections.value.splice(index, 1)
  }
}

function pickPhoto(product,section){
  let is_selected = false
  const selected_section = sections.value.find(item => item.id === section.id)
  is_selected = checkExistPhoto(product,section)
  if(is_selected){
    selected_section.product_items = selected_section.product_items.filter(item => item !== product.retailer_id)
  } else {
    selected_section.product_items.push(product.retailer_id)
  }
  console.log(sections.value)
}

function checkExistPhoto(product,section){
  let is_selected = false
  const selected_section = sections.value.find(item => item.id === section.id)
  if (selected_section.product_items.includes(product.retailer_id)){
    is_selected = true
  } 
  return is_selected
}

function downloadTemplate(){
  const headers = ['contact_phone_number']
  const row = {'contact_phone_number':''};
  props.component.forEach((item) => {
    if (item.type === "HEADER" && item.example?.header_text) {
      item.example.header_text.forEach((header, i) => {
        const key = `header_${String(i + 1).padStart(2, '0')}`;
        headers.push(key);
        row[key] = header;
      });
    }
    if (item.type === "BODY" && item.example?.body_text) {
      item.example.body_text[0].forEach((body, i) => {
        const key = `body_${String(i + 1).padStart(2, '0')}`;
        //console.log(key)
        headers.push(key);
        row[key] = body;
      });
    }
    if (item.type === "BUTTONS") {
      item.buttons.forEach((button, i) => {
        if(button.type == 'COPY_CODE'){
          const key = 'coupon'
          headers.push(key)
          row[key] = button.example[0]
        }
        if(button.type == 'URL'){
          if(button.example){
            const key = 'url'
            headers.push(key)
            row[key] = button.example[0]
          }
        }
      });
    }
  })

  //Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet([row], { header: headers });

  //Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  //Write workbook and trigger download
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "import_template.xlsx");
}



updateBodyVariables()

</script>

<style>
#row_margin{
  margin-bottom:20px;
}

#margin_10{
  margin-top:20px;
  margin-bottom:20px;
}


</style>



<template>
  <loading v-model:active="spin_loading"
  :is-full-page="true"/>
  <div class="modal fade" id="modalLg2">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Product Details</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body" v-if="selected_product">
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Name
                    </div>
                    <div class="col-md-3">
                      {{selected_product.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Description
                    </div>
                    <div class="col-md-9">
                      {{selected_product.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Currency
                    </div>
                    <div class="col-md-9">
                      {{selected_product.currency}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Original Price
                    </div>
                    <div class="col-md-9">
                      {{selected_product.price}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Sale Price
                    </div>
                    <div class="col-md-9">
                      {{selected_product.sale_price}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Availability
                    </div>
                    <div class="col-md-9">
                      {{selected_product.availability}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Product Link
                    </div>
                    <div class="col-md-9">
                      {{selected_product.url}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Brand
                    </div>
                    <div class="col-md-9">
                      {{selected_product.brand}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Weight
                    </div>
                    <div class="col-md-9">
                      {{selected_product.weight}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Weight Unit
                    </div>
                    <div class="col-md-9">
                      {{selected_product.weight_unit}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Product Thumbnail
                    </div>
                    <div class="col-md-9">
                      <img :src="selected_product.image_url" style="width: 30%;">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="list-group list-group-flush" v-if="update_additional_image_urls.length > 0">
              <div class="list-group-item d-flex align-items-center">
                <div class="flex-fill">
                  <div class="row">
                    <div class="col-md-3">
                      Additonal images
                    </div>
                    <div class="col-md-9">
                      <img :src="image.url" style="width: 30%;" v-for="image in update_additional_image_urls">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row" v-if="error_message" id="marin_top_10">
              <div class="alert alert-warning">
                <strong>Ohh !</strong> {{error_message}}
              </div>
            </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  
  <fragment v-if="props.template_type == 'specific_products' && props.products.length > 0">
    <card-body>
      <div class="row">
        <div class="col-md-6">
          <label for="formControlRange" class="form-label">Choose the cover thumbnail of product message</label>
          <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="click the cover of below photos" v-model="thumbnail_product_id" readonly/>
        </div>
      </div>

      <div class="row" id="margin_10">
        <div class="col-md-3">
          <button class="btn btn-teal me-2" type="button" @click="addSection">Add Section</button>
        </div>
      </div>

      <fragment v-for="section in sections">
        <div class="row" id="margin_10">
          <div class="col-md-6">
            <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="Title of section" v-model="section.title"/>
          </div>
          <div class="col-md-3">
            <button class="btn btn-danger me-2" type="button" @click="deleteSection(section.id)">Delete section</button>
          </div>
          <div class="col-md-3">
            <button class="btn btn-secondary me-2" type="button" data-bs-toggle="collapse" :data-bs-target="'#'+section.div_name">Hide / Unhide products</button>
          </div>
        </div>

        <div class="accordion" id="accordionExample">
          <div class="accordion-item">
            <div :id="section.div_name" class="accordion-collapse collapse show" data-bs-parent="#accordionExample">
              <div class="accordion-body">
                <div class="row" id="margin_10">
                  <div class="col-md-3" v-for="product in products">
                    <div class="row">
                      <img :src="product.image_url">
                    </div>
                    <div class="row" id="margin_10">
                      <div class="col-md-4">
                        <div class="form-check">
													<input class="form-check-input" type="checkbox" id="gridCheck1" @click="pickPhoto(product,section)">
                          <label class="form-check-label" for="gridCheck1">
                            Select photo
													</label>
												</div>
                        <!-- <div class="form-check form-switch">
                          <input type="checkbox" class="form-check-input" id="customSwitch1" @click="pickPhoto(product,section)">
                        </div> -->
                      </div>
                      <div class="col-md-4">
                        <button type="button" class="btn btn-info me-2" @click="makeasCoverPhoto(product)">Cover</button>
                      </div>
                      <div class="col-md-4">
                        <button type="button" class="btn btn-yellow me-2" data-bs-toggle="modal" data-bs-target="#modalLg2" @click="displayProduct(product)">Show</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>   
      </fragment>
    </card-body>
    <hr>
  </fragment>

  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">{{ template_name }}</div>
    </div>
  </card-body>
  <hr>

  <card-body v-for="tc in props.component">
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">{{getComponentName(tc.type)}}</div>
    </div>
    <template v-if="tc.type == 'HEADER'">
      <fragment v-if="tc.format == 'IMAGE' || tc.format == 'VIDEO' && tc.example">
        <div class="row">
          <div class="col-md-12" style="margin-top:10px;" v-if="tc.format == 'IMAGE'">
            <img :src="tc.example.header_handle[0]" style="width:30%">
          </div>
          <div class="col-md-12" style="margin-top:10px;" v-if="tc.format == 'VIDEO'">
            Video
          </div>
        </div>
        <div class="row" style="margin-top:20px;">
          <div class="col-12">
            <card>
              <card-body style="background-color:#ffffe0;">
                <p class="card-text">If you want to change the default header file, please upload</p>
                <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="image/*,video/*"/>
              </card-body>
            </card>
          </div>
        </div>
      </fragment>

      <fragment v-if="tc.format == 'DOCUMENT' && tc.example">
        <div class="row">
          <div class="col-md-12" style="margin-top:10px;">
            <label class="form-label" for="defaultFile"><a :href="tc.example.header_handle[0]" target="_blank">View original document</a></label>
          </div>
        </div>
        <div class="row" style="margin-top:20px;">
          <div class="col-12">
            <card>
              <card-body style="background-color:#ffffe0;">
                <p class="card-text">If you want to change the default document, please upload</p>
                <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="application/pdf"/>
              </card-body>
            </card>
          </div>
        </div>
      </fragment>

      <fragment v-if="tc.format == 'TEXT'">
        <div class="row">
          <div class="row" style="margin-top:10px;">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{tc.text}}</p>
                </card-body>
              </card>
            </div>
          </div>
          <div class="row" style="margin-top:10px;" v-if="tc.example">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">Variable: {{tc.example.header_text[0]}}</p>
                    <p class="card-text">You could input text to replace "{{tc.example.header_text[0]}}"</p>
                    <input type="text" class="form-control" v-model="header_text"/>
                </card-body>
              </card>
            </div>
          </div>
        </div>
      </fragment>
    </template>

    <template v-if="tc.type == 'BODY'">
      <div class="row">
          <div class="row">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{tc.text}}</p>
                </card-body>
              </card>
            </div>
          </div>
          <div class="row" style="margin-top:10px;" v-if="tc.example">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">Variable(s): {{tc.example.body_text[0].join(", ")}}</p>
                    <p class="card-text">you could replace the above {{tc.example.body_text[0].length}} variable(s)</p>
                    <div class="row" v-for="bv in body_variables">
                      <div class="col-12" style="margin-top:10px;">
                        <input type="text" class="form-control" v-model="bv.value"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
      </div>
    </template>

    <template v-if="tc.type == 'LIMITED_TIME_OFFER'">
      <div class="row">
          <div class="row">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{timeConverter(tc.limited_time_offer.text)}}</p>
                </card-body>
              </card>
            </div>
          </div>
          <div class="row" style="margin-top:10px;">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">You could change the expiry date and time of special offer</p>
                    <div class="row">
                      <div class="col-12" style="margin-top:10px;">
                        <datepicker v-model="limited_time_offer_text" @update:model-value="getDateTime"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
      </div>
    </template>

    <template v-if="tc.type == 'FOOTER'">
      <div class="row">
          <div class="row">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{tc.text}}</p>
                </card-body>
              </card>
            </div>
          </div>
      </div>
    </template>

    <template v-if="tc.type == 'BUTTONS'">
      <div class="row" v-for="button in tc.buttons">
        <template v-if="button.type == 'COPY_CODE'">
          <div class="row">
              <div class="row">
                <div class="col-12">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Coupon Button: {{button.text}}
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Offer Code: {{button.example[0]}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <div class="row" style="margin-top:10px;margin-bottom:10px;">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">You could change the offer code</p>
                    <div class="row">
                      <div class="col-12" style="margin-top:10px;">
                        <input type="text" class="form-control" placeholder="" v-model="offer_code" @keyup="restrictSpecialChars"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
          <hr>
        </template>

        <template v-if="button.type == 'URL'">
          <div class="row">
              <div class="row">
                <div class="col-12">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Website Button: {{button.text}}
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Url: {{button.url}}
                        </div>
                      </div>
                      <div class="row" v-if="button.example">
                        <div class="col-12" style="margin-top:10px;">
                          Variable: {{button.example[0]}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <div class="row" style="margin-top:10px;" v-if="url_variables.length > 0">
            <div class="col-12">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">You could change the variable</p>
                    <div class="row">
                      <div class="col-12" style="margin-top:10px;" v-for="uv in url_variables">
                        <input type="text" class="form-control" placeholder="" v-model="uv.value"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
          <hr style="margin-top:10px;">
        </template>

        <template v-if="button.type == 'PHONE_NUMBER'">
          <div class="row">
              <div class="row">
                <div class="col-12">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Call Button: {{button.text}}
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Phone number: {{button.phone_number}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>

        <template v-if="button.type == 'FLOW'">
          <div class="row">
              <div class="row">
                <div class="col-12">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Whatsapp flow
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Flow name: {{button.navigate_screen}}
                        </div>
                        <div class="col-12" style="margin-top:10px;">
                          Button text: {{button.text}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>


        <template v-if="button.type == 'QUICK_REPLY'">
          <div class="row">
              <div class="row">
                <div class="col-12">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Quick reply: {{button.text}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>

        <template v-if="button.type == 'CATALOG'">
          <div class="row">
              <div class="row">
                <div class="col-12">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Text: {{button.text}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>

        <template v-if="button.type == 'MPM'">
          <div class="row">
              <div class="row">
                <div class="col-12">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Text: {{button.text}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>

      </div>
    </template>
  </card-body>

  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Message preview</div>
    </div>
    <div class="row" style="margin-top:10px;">
      <div class="col-12">
        <card>
          <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
              <p class="card-text">Please input the phone number for message preview</p>
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="Country code + phone number" v-model="recipient"/>
                </div>
              </div>
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <button type="button" class="btn btn-primary mb-1 me-1" @click="preview">Preview</button>
                </div>
              </div>
          </card-body>
        </card>
      </div>
    </div>
  </card-body>
  <hr>

  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Download sending message template</div>
    </div>
    <div class="row" style="margin-top:10px;">
      <div class="col-12">
        <card>
          <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <button type="button" class="btn btn-primary mb-1 me-1" @click="downloadTemplate">Download</button>
                </div>
              </div>
          </card-body>
        </card>
      </div>
    </div>
  </card-body>

  <card-body v-if="imported_data">
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Set sending schedule</div>
    </div>
    <div class="row" style="margin-top:10px;">
      <div class="col-12">
        <card>
          <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
              <p class="card-text">Please set your schedule for sending multiple messages </p>
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <datepicker 
                    v-model="schedule_time" 
                    :min-date="minDate"
                    :disabled-dates="disableDates"
                  />
                </div>
              </div>
          </card-body>
        </card>
      </div>
    </div>
  </card-body>

  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Send to multiple recipients</div>
    </div>
    <div class="row" style="margin-top:10px;">
      <div class="col-12">
        <card>
          <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <input type="file" class="form-control" id="defaultFile" @change="uploadExcel" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"/>
                </div>
              </div>
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <button type="button" class="btn btn-primary mb-1 me-1" @click="sendMultiple" v-if="imported_data">Send Multiples</button>
                </div>
              </div>
          </card-body>
        </card>
      </div>
    </div>
  </card-body>
</template>
