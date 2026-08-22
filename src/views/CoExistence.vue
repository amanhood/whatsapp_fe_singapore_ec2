<script setup>

import {
  ref,
  onMounted,
  onUnmounted
} from 'vue'

import {
  postRequest
} from '../composables/api.js'

import { Toast } from 'bootstrap'

import {
  useRouter
} from 'vue-router'


const router = useRouter()


// ============================================================
// SESSION
// ============================================================

let token =
  sessionStorage.getItem("token")

let username =
  sessionStorage.getItem("username")

let role =
  ref(
    sessionStorage.getItem("role")
  )


let fb_login_error_message =
  ref(null)

let notification_message =
  ref(null)


// ============================================================
// EXISTING WHATSAPP ACCOUNTS
// ============================================================

let whatsapp_accounts =
  ref([])


// ============================================================
// COEXISTENCE EMBEDDED SIGNUP
// ============================================================

let coexistence_code =
  ref(null)

let coexistence_waba_id =
  ref(null)

let coexistence_phone_number_id =
  ref(null)

let coexistence_business_id =
  ref(null)

let coexistence_loading =
  ref(false)

let coexistence_signup_finished =
  ref(false)


// ============================================================
// META SETTINGS
// ============================================================

const META_APP_ID =
  "1060499497949619"


const COEXISTENCE_CONFIG_ID =
  "1058568108496704"


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

  notification_message.value =
    message


  const toastElement =
    document.getElementById(
      'toast-1'
    )


  if (!toastElement) {

    return

  }


  const toast =
    new Toast(
      toastElement
    )


  toast.show()

}


// ============================================================
// CHECK LOGIN
// ============================================================

function checkLogin() {

  if (!token) {

    router.push(
      '/page/login'
    )

    return

  }


  if (
    role.value === 'child'
  ) {

    router.push(
      '/page/login'
    )

  }

}


// ============================================================
// CHECK EXISTING WHATSAPP ACCOUNTS
// ============================================================

async function checkWaba() {

  try {

    let data =
      await postRequest(
        "check_waba",
        null,
        token
      )


    if (
      data.request &&
      data.request.status === 200
    ) {

      whatsapp_accounts.value =
        data['data']['whatsapp_accounts']


      console.log(
        "WhatsApp accounts:",
        whatsapp_accounts.value
      )

    }


  } catch (error) {

    console.error(
      "checkWaba error:",
      error
    )

  }

}


// ============================================================
// FACEBOOK SDK
// ============================================================

function initialiseFacebookSDK() {

  window.fbAsyncInit =
    () => {

      window.FB.init({

        appId:
          META_APP_ID,

        cookie:
          true,

        xfbml:
          true,

        version:
          "v25.0"

      })

    }


  // SDK already loaded
  if (
    document.getElementById(
      'facebook-jssdk'
    )
  ) {

    if (
      window.FB
    ) {

      window.fbAsyncInit()

    }

    return

  }


  const js =
    document.createElement(
      'script'
    )


  js.id =
    'facebook-jssdk'


  js.src =
    'https://connect.facebook.net/en_US/sdk.js'


  js.async =
    true


  js.defer =
    true


  const firstScript =
    document.getElementsByTagName(
      'script'
    )[0]


  firstScript.parentNode.insertBefore(
    js,
    firstScript
  )

}


// ============================================================
// START COEXISTENCE EMBEDDED SIGNUP
// ============================================================

function logInWithFacebookCoexistence() {

  if (
    !window.FB
  ) {

    showToast(
      "Facebook SDK has not loaded."
    )

    return

  }


  // Reset previous session

  coexistence_code.value =
    null

  coexistence_waba_id.value =
    null

  coexistence_phone_number_id.value =
    null

  coexistence_business_id.value =
    null

  coexistence_signup_finished.value =
    false

  coexistence_loading.value =
    true

  fb_login_error_message.value =
    null


  window.FB.login(

    response => {

      console.log(
        "Coexistence FB.login response:",
        response
      )


      if (
        response.authResponse &&
        response.authResponse.code
      ) {

        coexistence_code.value =
          response.authResponse.code


        console.log(
          "Coexistence OAuth code received"
        )


        tryCompleteCoexistenceSignup()

      }

      else {

        coexistence_loading.value =
          false


        fb_login_error_message.value =
          "User cancelled WhatsApp Business App onboarding."


        showToast(
          fb_login_error_message.value
        )

      }

    },

    {

      config_id:
        COEXISTENCE_CONFIG_ID,


      response_type:
        "code",


      override_default_response_type:
        true,


      extras: {

        setup: {},


        featureType:
          "whatsapp_business_app_onboarding",


        sessionInfoVersion:
          3

      }

    }

  )

}


// ============================================================
// PROCESS EMBEDDED SIGNUP SESSION
// ============================================================

function processCoexistenceSession(
  data
) {

  console.log(
    "Processing Coexistence session:",
    data
  )


  if (!data) {

    return

  }


  // ----------------------------------------------------------
  // WABA ID
  // ----------------------------------------------------------

  if (
    data.waba_id
  ) {

    coexistence_waba_id.value =
      String(
        data.waba_id
      )

  }


  // ----------------------------------------------------------
  // Phone Number ID
  // ----------------------------------------------------------

  if (
    data.phone_number_id
  ) {

    coexistence_phone_number_id.value =
      String(
        data.phone_number_id
      )

  }


  // ----------------------------------------------------------
  // Business ID
  // ----------------------------------------------------------

  if (
    data.business_id
  ) {

    coexistence_business_id.value =
      String(
        data.business_id
      )

  }


  console.log(
    "Coexistence WABA ID:",
    coexistence_waba_id.value
  )


  console.log(
    "Coexistence Phone Number ID:",
    coexistence_phone_number_id.value
  )


  console.log(
    "Coexistence Business ID:",
    coexistence_business_id.value
  )


  tryCompleteCoexistenceSignup()

}


// ============================================================
// CHECK WHETHER SIGNUP DATA IS COMPLETE
// ============================================================

async function tryCompleteCoexistenceSignup() {

  if (
    coexistence_signup_finished.value
  ) {

    return

  }


  // Need OAuth code

  if (
    !coexistence_code.value
  ) {

    console.log(
      "Waiting for Coexistence OAuth code..."
    )

    return

  }


  // Need WABA ID

  if (
    !coexistence_waba_id.value
  ) {

    console.log(
      "Waiting for Coexistence WABA ID..."
    )

    return

  }


  coexistence_signup_finished.value =
    true


  await generateCoexistenceAccessToken()

}


// ============================================================
// SEND SIGNUP RESULT TO DJANGO
// ============================================================

async function generateCoexistenceAccessToken() {

  const payload = {

    code:
      coexistence_code.value,


    waba_id:
      coexistence_waba_id.value,


    phone_number_id:
      coexistence_phone_number_id.value,


    business_id:
      coexistence_business_id.value,


    coexistence:
      true

  }


  console.log(
    "Sending Coexistence signup to backend:",
    {

      ...payload,

      code:
        "[hidden]"

    }
  )


  try {

    const data =
      await postRequest(

        "generate_fb_coexistence_access_token",

        payload,

        token

      )


    console.log(
      "Coexistence backend response:",
      data
    )


    if (
      data.request &&
      data.request.status === 200
    ) {

      showToast(
        "WhatsApp Business App connected successfully."
      )


      await checkWaba()

    }

    else {

      coexistence_signup_finished.value =
        false


      showToast(
        data?.data?.message ||
        "Failed to connect WhatsApp Business App."
      )

    }

  }

  catch (error) {

    coexistence_signup_finished.value =
      false


    console.error(
      "Coexistence backend error:",
      error
    )


    showToast(
      "Failed to connect WhatsApp Business App."
    )

  }

  finally {

    coexistence_loading.value =
      false

  }

}


// ============================================================
// EMBEDDED SIGNUP WINDOW MESSAGE LISTENER
// ============================================================

const sessionInfoListener =
  event => {


    const allowedOrigins = [

      "https://www.facebook.com",

      "https://web.facebook.com"

    ]


    if (
      !allowedOrigins.includes(
        event.origin
      )
    ) {

      return

    }


    let data


    try {

      data =
        typeof event.data ===
          "string"

          ? JSON.parse(
              event.data
            )

          : event.data

    }

    catch {

      return

    }


    if (
      !data
    ) {

      return

    }


    if (
      data.type !==
      "WA_EMBEDDED_SIGNUP"
    ) {

      return

    }


    console.log(
      "WA_EMBEDDED_SIGNUP:",
      data
    )


    // ========================================================
    // FINISH
    // ========================================================

    if (
      data.event ===
      "FINISH"
    ) {

      processCoexistenceSession(
        data.data || {}
      )

      return

    }


    // ========================================================
    // COEXISTENCE FINISH
    // ========================================================

    if (
      data.event ===
      "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"
    ) {

      processCoexistenceSession(
        data.data || {}
      )

      return

    }


    // ========================================================
    // CANCEL
    // ========================================================

    if (
      data.event ===
      "CANCEL"
    ) {

      console.log(
        "Embedded Signup cancelled:",
        data.data
      )


      coexistence_loading.value =
        false


      coexistence_signup_finished.value =
        false


      const currentStep =
        data.data?.current_step


      showToast(

        currentStep

          ? `WhatsApp signup cancelled at ${currentStep}.`

          : "WhatsApp signup cancelled."

      )


      return

    }


    // ========================================================
    // ERROR
    // ========================================================

    if (
      data.event ===
      "ERROR"
    ) {

      console.error(
        "Embedded Signup error:",
        data.data
      )


      coexistence_loading.value =
        false


      coexistence_signup_finished.value =
        false


      showToast(

        data.data?.error_message ||

        "WhatsApp Embedded Signup failed."

      )

    }

  }


// ============================================================
// NAVIGATION
// ============================================================

function go_message() {

  router.push({

    path:
      '/page/check-messages'

  })

}


function go_marketing_templates() {

  router.push({

    path:
      '/page/marketing-templates'

  })

}


function go_auto_reply() {

  router.push({

    path:
      '/page/flow-index'

  })

}


function go_landing_pages() {

  router.push({

    path:
      '/page/landing-pages'

  })

}


function go_flows() {

  router.push({

    path:
      '/page/flows'

  })

}


function go_campaigns() {

  router.push({

    path:
      '/page/campaigns'

  })

}


// ============================================================
// LIFECYCLE
// ============================================================

onMounted(
  () => {

    initialiseFacebookSDK()


    window.addEventListener(
      'message',
      sessionInfoListener
    )


    checkLogin()


    checkWaba()

  }
)


onUnmounted(
  () => {

    window.removeEventListener(
      'message',
      sessionInfoListener
    )

  }
)

</script>


<template>

  <!-- ====================================================== -->
  <!-- TOAST -->
  <!-- ====================================================== -->

  <div class="toasts-container">

    <div
      class="toast fade hide"
      data-autohide="false"
      id="toast-1"
    >

      <div class="toast-header">

        <i
          class="far fa-bell text-muted me-2"
        ></i>


        <strong class="me-auto">

          Alert

        </strong>


        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="toast"
        ></button>

      </div>


      <div class="toast-body">

        {{ notification_message }}

      </div>

    </div>

  </div>


  <!-- ====================================================== -->
  <!-- WHATSAPP -->
  <!-- ====================================================== -->

  <card>

    <card-body class="pb-2">


      <!-- ================================================== -->
      <!-- COEXISTENCE SIGNUP -->
      <!-- ================================================== -->

      <div
        class="row"
        style="margin-bottom:30px;"
      >

        <div class="col-xl-12">

          <div class="mb-2">

            <strong>

              WhatsApp Business App + API

            </strong>

          </div>


          <div
            class="text-muted mb-3"
          >

            Connect your existing WhatsApp Business App
            number to the WhatsApp API while continuing
            to use the WhatsApp Business mobile app.

          </div>


          <button

            type="button"

            class="btn btn-success"

            :disabled="
              coexistence_loading
            "

            @click="
              logInWithFacebookCoexistence
            "

          >


            <template
              v-if="
                coexistence_loading
              "
            >

              <span
                class="
                  spinner-border
                  spinner-border-sm
                  me-1
                "
              ></span>


              Connecting...

            </template>


            <template v-else>

              <i
                class="
                  fab
                  fa-whatsapp
                  fa-fw
                  me-1
                "
              ></i>


              Connect Existing WhatsApp Business App

            </template>


          </button>

        </div>

      </div>


      <!-- ================================================== -->
      <!-- ERROR -->
      <!-- ================================================== -->

      <div

        v-if="
          fb_login_error_message
        "

        class="
          alert
          alert-danger
        "

      >

        {{
          fb_login_error_message
        }}

      </div>


      <!-- ================================================== -->
      <!-- EXISTING ACCOUNTS -->
      <!-- ================================================== -->

      <div

        class="row"

        v-if="
          whatsapp_accounts.length > 0
        "

      >

        <div class="col-xl-12">


          <div
            class="table-responsive"
          >

            <table
              class="
                table
                table-hover
                text-nowrap
              "
            >


              <thead>

                <tr>


                  <th
                    class="
                      border-top-0
                      pt-0
                      pb-2
                    "
                  >

                    WhatsApp Account

                  </th>


                  <th
                    class="
                      border-top-0
                      pt-0
                      pb-2
                    "
                  >

                    Messaging

                  </th>


                  <th
                    class="
                      border-top-0
                      pt-0
                      pb-2
                    "
                  >

                    Marketing Templates

                  </th>


                  <th
                    class="
                      border-top-0
                      pt-0
                      pb-2
                    "
                  >

                    Auto Reply

                  </th>


                  <th
                    class="
                      border-top-0
                      pt-0
                      pb-2
                    "
                  >

                    Landing Pages

                  </th>


                  <th
                    class="
                      border-top-0
                      pt-0
                      pb-2
                    "
                  >

                    WhatsApp Flows

                  </th>


                  <th
                    class="
                      border-top-0
                      pt-0
                      pb-2
                    "
                  >

                    Campaigns

                  </th>


                </tr>

              </thead>


              <tbody>


                <tr

                  v-for="
                    account
                    in
                    whatsapp_accounts
                  "

                  :key="
                    account.phone_number_id
                  "

                >


                  <!-- ACCOUNT -->

                  <td
                    class="
                      align-middle
                    "
                  >

                    <div>

                      {{
                        account.phone_number
                      }}

                    </div>


                    <div
                      class="mt-1"
                    >

                      <span
                        class="
                          badge
                          bg-success
                        "
                      >

                        Business App + API

                      </span>

                    </div>

                  </td>


                  <!-- MESSAGE -->

                  <td
                    class="
                      align-middle
                    "
                  >

                    <button

                      type="button"

                      class="
                        btn
                        btn-yellow
                      "

                      @click="
                        go_message
                      "

                    >

                      Access

                    </button>

                  </td>


                  <!-- TEMPLATE -->

                  <td
                    class="
                      align-middle
                    "
                  >

                    <button

                      type="button"

                      class="
                        btn
                        btn-yellow
                      "

                      @click="
                        go_marketing_templates
                      "

                    >

                      Access

                    </button>

                  </td>


                  <!-- AUTO REPLY -->

                  <td
                    class="
                      align-middle
                    "
                  >

                    <button

                      type="button"

                      class="
                        btn
                        btn-yellow
                      "

                      @click="
                        go_auto_reply
                      "

                    >

                      Access

                    </button>

                  </td>


                  <!-- LANDING PAGE -->

                  <td
                    class="
                      align-middle
                    "
                  >

                    <button

                      type="button"

                      class="
                        btn
                        btn-yellow
                      "

                      @click="
                        go_landing_pages
                      "

                    >

                      Access

                    </button>

                  </td>


                  <!-- FLOWS -->

                  <td
                    class="
                      align-middle
                    "
                  >

                    <button

                      type="button"

                      class="
                        btn
                        btn-yellow
                      "

                      @click="
                        go_flows
                      "

                    >

                      Access

                    </button>

                  </td>


                  <!-- CAMPAIGNS -->

                  <td
                    class="
                      align-middle
                    "
                  >

                    <button

                      type="button"

                      class="
                        btn
                        btn-yellow
                      "

                      @click="
                        go_campaigns
                      "

                    >

                      Access

                    </button>

                  </td>


                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>


      <!-- ================================================== -->
      <!-- NO ACCOUNT -->
      <!-- ================================================== -->

      <div

        v-else

        class="row"

      >

        <div class="col-xl-12">

          <div
            class="
              alert
              alert-secondary
            "
          >

            No WhatsApp account connected.

          </div>

        </div>

      </div>


    </card-body>

  </card>

</template>