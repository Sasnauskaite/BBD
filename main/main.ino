#include <WiFi.h>
#include <HTTPClient.h>
#include <LiquidCrystal.h>
#include <ArduinoJson.h>

// DIRECTIONS
// 1. change the information in secret.h file into your:
//    - wi-fi name
//    - wi-fi password
//    - write your local IP address into the http links
//    - write port number into the http links
// 2. Upload both files to Arduino microcontroller and it will start running the code!
#include "secret.h"


// information that can be changed:
int displayCount = 3;             // Amount of times the message will be displayed
int timeGap = 500;               // Time gap between messages
int scrollSpeed = 500;            // The speed of a message going through the LCD screen
const String boxCode = "box0000"; // boxCode used to query messages that are sent to the device with this name

// variables that are not recomended to be changed:
const char *ssid = SSID;
const char *password = WiFiPassword;
const char *serverAddressForGet = serverHostGet;
const char *serverAddressForUpdate = serverHostUpdate;

LiquidCrystal lcd(12, 11, 10, 9, 8, 7);

HTTPClient http;

void setup()
{
  Serial.begin(115200);
  lcd.begin(16, 2);

  Serial.println();
  Serial.print("Connecting to WiFi");

  WiFi.begin(ssid, password);

  uint8_t i = 0;
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(1000);
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println();
    Serial.println("Successfully connected to Wi-Fi!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    lcd.setCursor(0, 0);
    lcd.print("Connected to ");
    lcd.setCursor(0, 1);
    lcd.print(ssid);
    delay(10000);
    lcd.clear();
  }
  else
  {
    Serial.println();
    Serial.println("Not able to connect to Wi-Fi...");
    lcd.setCursor(0, 0);
    lcd.print("Not connected to ");
    lcd.setCursor(0, 1);
    lcd.print(ssid);
    delay(10000);
    lcd.clear();
  }
}

void loop()
{
  // Sending GET request with parameters to locally running node.js server
  if (WiFi.status() == WL_CONNECTED)
  {
    String reqParams = "?code=" + boxCode + "&seen=false";
    http.begin(serverAddressForGet + reqParams);

    int httpCode = http.GET();

    if (httpCode > 0)
    {
      Serial.print("HTTP response code: ");
      Serial.println(httpCode);
      if (httpCode == HTTP_CODE_OK)
      {
        String message = http.getString();
        Serial.print("Messages received:");
        Serial.println(message);

        // Parsing JSON response
        DynamicJsonDocument jsonDocument(1024);
        DeserializationError error = deserializeJson(jsonDocument, message);

        if (error)
        {
          Serial.print("Error parsing JSON: ");
          Serial.println(error.c_str());
          return;
        }

        // Checking if the response is an array and has any messages in it
        if (jsonDocument.is<JsonArray>() && jsonDocument.size() > 0)
        {
          int messageToExtract = 0;

          JsonObject newMessage = jsonDocument[messageToExtract];
          // Accessing message attributes
          String _id = newMessage["_id"].as<String>();
          String code = newMessage["code"].as<String>();
          String text = newMessage["message"].as<String>();
          String sender = newMessage["sender"].as<String>();
          bool seen = newMessage["seen"].as<bool>();

          String senderShow = sender + " says:";
          printMessageToLcd(senderShow, text);
          setMessageToSeen(_id);
        }
        else
        {
          lcd.setCursor(0, 0);
          lcd.print("No new messages.");
          Serial.println("No messages received or empty array.");
          delay(15000);
          lcd.clear();
        }
      }
      else
      {
        lcd.setCursor(0, 0);
        lcd.print("Error fetching message.");
        Serial.println("Error fetching message!");
        Serial.print("Error message: ");
        Serial.println(http.errorToString(httpCode).c_str());
      }
    }
    else
    {
      Serial.println("Error on HTTP request");
    }

    http.end();
    // Wait before sending the next request
    delay(timeGap);
  }
}

void printMessageToLcd(String senderShow, String text)
{
  for (int count = 0; count < displayCount; count++)
  {
    // Showing senders name on LCD screen
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(senderShow);

    // Showing message text on LCD screen
    lcd.setCursor(0, 1);
    lcd.print(text);

    int senderCounter = 0;
    int textCounter = 0;
    int maxLength = max(senderShow.length(), text.length());

    // Scroll both sender name and text message together
    for (int i = 0; i < maxLength + 16; i++)
    {
      lcd.clear();

      int senderStart = max(0, senderCounter);
      int textStart = max(0, textCounter);

      lcd.setCursor(0, 0);
      lcd.print(senderShow.substring(senderStart, min(static_cast<int>(senderShow.length()), senderStart + 16)));

      lcd.setCursor(0, 1);
      lcd.print(text.substring(textStart, min(static_cast<int>(text.length()), textStart + 16)));

      senderCounter = (senderCounter + 1) % (senderShow.length() + 1);
      textCounter = (textCounter + 1) % (text.length() + 1);

      delay(scrollSpeed); // Speed of scrolling
    }
    lcd.clear();
    delay(7000);
  }
}

void setMessageToSeen(String _id)
{
  HTTPClient http;
  String url = String(serverAddressForUpdate) + "/" + _id;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Sending the PUT request
  int httpResponseCode = http.PUT("");

  if (httpResponseCode > 0)
  {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
  }
  else
  {
    Serial.print("Error on sending PUT request: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}
