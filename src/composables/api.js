import axios from "axios";

var BASE_LOGIN_URL = "https://biz-api.com/api/"

export async function userRequest(path = null,payload){
  try {
      const response = await axios.post(BASE_LOGIN_URL + path + "/",payload)
      return response
  } catch(error) {
      return error
  }
}

export async function getRequest(path = null,user_token){
  try {
      const response = await axios.get(BASE_LOGIN_URL + path + "/",{
          headers:{
              Authorization: "Token "+user_token
          }
      })
      return response
  } catch(error) {
      return error
  }
}

export async function postRequest(path = null,payload,user_token){
  try {
      const response = await axios.post(BASE_LOGIN_URL + path + "/",payload,{
          headers:{
              Authorization: "Token "+user_token
          }
      })
      return response
  } catch(error) {
      return error
  }
}

export async function putRequest(path = null,payload,user_token){
  try {
      const response = await axios.put(BASE_LOGIN_URL + path + "/",payload,{
          headers:{
              Authorization: "Token "+user_token
          }
      })
      return response
  } catch(error) {
      return error
  }
}

export async function deleteRequest(path = null,user_token){
  try {

      const response = await axios.delete(BASE_LOGIN_URL + path + "/",{
          headers:{
              Authorization: "Token "+user_token
          }
      })
      return response
  } catch(error) {
      return error
  }
}

export async function postWithoutTokenRequest(path = null,payload){
  try {
      const response = await axios.post(BASE_LOGIN_URL + path + "/",payload)
      return response
  } catch(error) {
      return error
  }
}
