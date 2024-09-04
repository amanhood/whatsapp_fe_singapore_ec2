export function responseMessage(data){
  let notification_message = ""
  console.log(data['data']['error'])
  if(data['data']['error']){
    if(data['data']['error']['error_user_title'] && data['data']['error']['error_user_msg']){
      notification_message = data['data']['error']['error_user_title'] + " : " + data['data']['error']['error_user_msg']
    } else if (data['data']['error']['message']) {
      notification_message = data['data']['error']['message']
    } else {
      notification_message = "error existed"
    }
    //if(data['data']['error']['message']){
    //  notification_message = data['data']['error']['message']
    //} else {
    //  notification_message = data['data']['error']['error_user_title'] + " : " + data['data']['error']['error_user_msg']
    //}
  } else {
    notification_message = "Success"
  }
  return notification_message
}
