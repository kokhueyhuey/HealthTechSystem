import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5165/notificationHub")
  .withAutomaticReconnect()
  .build();

export default connection;