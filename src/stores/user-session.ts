import { defineStore } from "pinia";

export const useUserSessionStore = defineStore({
  id: "userSession",
  state: () => {
    return {
    	username: '',
    	token: ''
		}
  }
});
