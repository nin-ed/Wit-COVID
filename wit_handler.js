const request = require("request-promise");
const cheerio = require("cheerio");
const schedule = require("node-schedule");
const axios = require("axios");

function responseFromWit(data) {
  console.log("data from wit:");
  console.log(JSON.stringify(data));

  const intent = data.intents.length > 0 && data.intents[0] || "__foo__";
  switch (intent.name) {
    case "report":
      return handleInfo(data);
    case "c_help":
      return handleCHelp(data);
    case "helpline":
      return handleHelpline(data);
    case "greet":
      return handleGreet();
    case "help":
      return handleHelp();
    case "bye":
      return handleBye();
    case "pincode":
      return handleBye();
  }
  
  return handleGibberish();
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function handleInfo(data){  
  const location = data.entities['wit$location:location'][0];
  if (location == null){
    return handleGibberish();
  }
  if(location.resolved.values[0].domain == 'country'){
    try{
      var loc = location.resolved.values[0].name;
    }
    catch(err){
      return "Some error has occurred. Check if there is any error in the question you asked";
    }
    
    if(loc=="United States of America"){
      loc = "US";
    }
    const url = "https://www.worldometers.info/coronavirus/country/" + loc;
    var cases = null, deaths=null, recov=null, newc=null, newd=null;
    return request({
      uri: url,
      transform: function(body) {
        return cheerio.load(body);
      }
    }).then($ => {
        //var $ = cheerio.load(html);
        var flag=0;
        $('#maincounter-wrap').filter(function(){
          var data = $(this);
          if((data.children().first().text()) == 'Coronavirus Cases:'){
            cases = data.children().last().children().text();
          }
          else if((data.children().first().text()) == 'Deaths:'){
            deaths = data.children().last().children().text();
          }
          else if((data.children().first().text()) == 'Recovered:'){
            recov = data.children().last().children().text();
          }
        })
        
        $('.news_li').filter(function(){
          if(flag==0){
            var data = $(this);
            newc = data.children().first().text().slice(0,-9);
            newd = data.children().first().next().text().slice(0,-10);
            flag = 1;
          }
        })
        if(cases==null){
          return "Some error has occurred which is from our side. I have informed my lazy developer about it.\n\nSorry for the inconvenience.";
        }
        return `Total Cases: ${cases}\nDeaths: ${deaths}\nRecovered: ${recov}\n\nIn the last 24 hours - Cases: ${newc}\nDeaths: ${newd}`;
    }).catch(err => console.log(err));
  }
  else{
    var loc = location.body;
    loc = toTitleCase(loc);
    if(loc == "Andaman And Nicobar Islands" || loc == "Andaman & Nicobar Islands"){
      loc = "Andaman and Nicobar Islands";
    }
    else if(loc == "Dadra" || loc == "Nagar Haveli" || loc == "Daman" || loc == "Diu"){
      loc = "Dadra and Nagar Haveli and Daman and Diu";
    }
    else if(loc == "Jammu And Kashmir"){
      loc == "Jammu and Kashmir";
    }
    else if(loc == "New Delhi"){
      loc == "Delhi";
    }

    const url = "https://www.mohfw.gov.in";
    return request({
        uri: url,
        transform: function(body){
            return cheerio.load(body);
        }
    }).then($ => {
        var flag = 0;
        var cases = null, deaths = null, recov = null;
        $('#state-data > div > div > div > div > table > tbody > tr').each((index, element) => {
            var data = $(element).children();
            if((data.first().next().text()) == loc){
              flag = 1;
              cases = data.last().text();
              deaths = data.first().next().next().next().next().text();
              recov = data.first().next().next().next().text();
            }
        })
        if(flag==0){
          return "Sorry, I'm unable to process your request";
        }
        return `Total Cases: ${cases}\nDeaths: ${deaths}\nRecovered: ${recov}`;
    }).catch(err => console.log(err))
  }
}

function processHelp(data){
  try{
    var loc = data.entities['wit$location:location'][0].body;
    loc = toTitleCase(loc);
  }
  catch(err){
    return [1, "I think you missed to mention state"];
  }
  
  var ph = null, link = null;
  if(loc == "Andaman & Nicobar Islands" || loc == "Andaman And Nicobar Islands"){
    ph = '03192-232102'
    link = 'https://dhs.andaman.gov.in/NewEvents/249.jpeg'
  }
  else if(loc == "Andhra Pradesh"){
    ph = '0866-2410978'
    link = 'http://hmfw.ap.gov.in/COVID-19%20IEC/COVID-19%20Hospitals.pdf'
  }
  else if(loc == "Arunachal Pradesh"){
    ph = '9436055743'
    link = 'http://nrhmarunachal.gov.in/covid_19_IEC.html'
  }
  else if(loc == "Assam"){
    ph = '6913347770'
    link = 'https://nhm.assam.gov.in/portlet-innerpage/dedicated-covid-hospitals'
  }
  else if(loc == "Bihar"){
    ph = '104'
    link = 'http://statehealthsocietybihar.org/'
  }
  else if(loc == "Chandigarh"){
    ph = '9779558282'
    link = 'http://chdcovid19.in/'
  }
  else if(loc == "Chhattisgarh"){
    ph = '104'
    link = 'http://cghealth.nic.in/cghealth17/'
  }
  else if((loc=="Daman") || (loc=="Diu") || (loc=="Dadra") || (loc=="Nagar Haveli")){
    ph = '104'
    link = 'http://dnh.nic.in/Docs/COVID19/COVID19Health_Fac08052020.pdf'
  }
  else if(loc == "Delhi"){
    ph = '011-22307145'
    link = 'https://coronabeds.jantasamvad.org/'
  }
  else if(loc == "Goa"){
    ph = '104'
    link = 'https://nhm.goa.gov.in/corona-virus-important-links-iec/'
  }
  else if(loc == "Gujarat"){
    ph = '104'
    link = 'https://nrhm.gujarat.gov.in/cir-noti-covid-19.htm'
  }
  else if(loc == "Haryana"){
    ph = '8558893911'
    link = 'http://nhmharyana.gov.in/page.aspx?id=208'
  }
  else if(loc == "Himachal Pradesh"){
    ph = '104'
    link = 'http://www.nrhmhp.gov.in/content/covid-health-facilities'
  }
  else if(loc == "Jammu And Kashmir"){
    ph = '01912520982, 0194-2440283'
    link = 'https://www.jknhm.com/covidfacilities.php'
  }
  else if(loc == "Jharkhand"){
    ph = '104'
    link = 'http://jrhms.jharkhand.gov.in/FileUploaded%20By%20User/DCovid_Hospitals.pdf'
  }
  else if(loc == "Karnataka"){
    ph = '104'
    link = 'https://karunadu.karnataka.gov.in/hfw/nhm/pages/home.aspx'
  }
  else if(loc == "Kerala"){
    ph = '0471-2552056'
    link = 'http://arogyakeralam.gov.in/2020/03/25/guidelines/'
  }
  else if(loc == "Ladakh"){
    ph = '01982256462'
    link = 'https://leh.nic.in/notice/covid19-hospital/'
  }
  else if(loc == "Lakshadweep"){
    ph = '104'
    link = 'https://cdn.s3waas.gov.in/s358238e9ae2dd305d79c2ebc8c1883422/uploads/2020/05/2020051228-1.pdf'
  }
  else if(loc == "Madhya Pradesh"){
    ph = '104'
    link = 'https://www.nhmmp.gov.in/CovidInformation.aspx'
  }
  else if(loc == "Maharashtra"){
    ph = '020-26127394'
    link = 'https://arogya.maharashtra.gov.in/1177/Dedicated-COVID-Facilities-Status'
  }
  else if(loc == "Manipur"){
    ph = '3852411668'
    link = 'http://nrhmmanipur.org/?page_id=2602'
  }
  else if(loc == "Meghalaya"){
    ph = '108'
    link = 'http://meghalayaonline.gov.in/covid/images/materials/hospitals.pdf'
  }
  else if(loc == "Mizoram"){
    ph = '102'
    link = 'http://nhmmizoram.org/page?id=202'
  }
  else if(loc == "Nagaland"){
    ph = '7005539653'
    link = 'http://nhmnagaland.in/Notification_file_path/Dedicated%20COVID%20Hospitals%20in%20Nagaland.pdf'
  }
  else if(loc == "Odisha"){
    ph = '9439994859'
    link = 'https://statedashboard.odisha.gov.in/'
  }
  else if(loc == "Puducherry"){
    ph = '104'
    link = 'https://health.py.gov.in/sites/default/files/NEET-PDF/Categorisation%20of%20covid%20facilities.pdf'
  }
  else if(loc == "Punjab"){
    ph = '104'
    link = 'http://pbhealth.gov.in/'
  }
  else if(loc == "Rajasthan"){
    ph = '0141-2225624'
    link = 'http://rajswasthya.nic.in/PDF/COvid%20Facility%20Rajasthan.pdf'
  }
  else if(loc == "Sikkim"){
    ph = '104'
    link = 'https://www.covid19sikkim.org/'
  }
  else if(loc == "Tamil Nadu"){
    ph = '044-29510500'
    link = 'https://stopcorona.tn.gov.in/%e0%ae%ae%e0%af%81%e0%ae%95%e0%af%8d%e0%ae%95%e0%ae%bf%e0%ae%af-%e0%ae%a4%e0%ae%95%e0%ae%b5%e0%ae%b2%e0%af%8d%e0%ae%95%e0%ae%b3%e0%af%8d/'
  }
  else if(loc == "Telangana"){
    ph = '104'
    link = 'https://www.chfw.telangana.gov.in/covid_hospitals.html'
  }
  else if(loc == "Tripura"){
    ph = '0381-2315879'
    link = 'http://tripuranrhm.gov.in/home/0905202001.pdf'
  }
  else if(loc == "Uttar Pradesh"){
    ph = '18001805145'
    link = 'https://updgmh-covid19.maps.arcgis.com/apps/opsdashboard/index.html#/bfc888151feb48928a4f6885ca20e83c'
  }
  else if(loc == "Uttarakhand"){
    ph = '104'
    link = 'https://health.uk.gov.in/pages/view/102-dedicated-covid-facilities-in-state'
  }
  else if(loc == "West Bengal"){
    ph = '1800313444222, 03323412600'
    link = 'https://www.wbhealth.gov.in/uploaded_files/corona/Notification___Revised___67_Covid_Hospital___30.04_.2020_.pdf'
  }
  return [0, ph, link];
}

function handleCHelp(data){
  var say = "Here are the listed serious symptoms - \n1. Difficulty in breathing or shortness of breath\n2. Chest pain or pressure\n3. Loss of speech or movement"
  var say1 = "If you see any of these symptoms in yourself, please reach out of some health facility immediately."
  var ph, link;
  const temp = processHelp(data);
  
  if(temp[0] == 1){
    return temp[1];
  }
  
  ph = temp[1];
  link = temp[2];
  if(ph==null && link==null){
    return "Some error has occurred. Please check from your side and I'll check from my side"; 
  }
  return `${say}\n\n${say1}\n------------------------------------------\nBelow are the hospitals listed in your entered state: \n${link} \nHelpline: ${ph}\n\nMinistry of Health and Family Welfare also provides means to get in touch with them as quickly as possible - \nToll Free: 1075\nHelpline: +91-11-23978046\nEmail: ncov2019@gov.in\n\nFAQ - \nhttps://www.mohfw.gov.in/pdf/FAQ.pdf\n\nIf you have minute symptoms, then also you should take some proper advice using ministry's helpline number.\n\nMay God bless you and I'll be praying to the God for your speedy recovery ${String.fromCodePoint(0x1F604)}`;
}

function handleHelpline(data){
  const temp = processHelp(data);
  
  if(temp[0] == 1){
    return temp[1];
  }
  
  var ph = temp[1];
  return Promise.resolve(
    `Here is your helpline numbers according to your entered state - \nHelpline: ${ph}\n\nContacts provided from ministry - \nToll Free: 1075\nHelpline: +91-11-23978046\nEmail: ncov2019@gov.in\n\nFAQ - \nhttps://www.mohfw.gov.in/pdf/FAQ.pdf`
  );
}

function handleGreet(){
  return Promise.resolve(
    'Hello. I hope you are doing well! How could I help you?'
  );
}

function handleHelp(){
  return Promise.resolve(
    "I can inform you about the cases of COVID-19 around the world. I answer only country-wise and also state-wise only for India.\n\nWell, the reason for limited information is that my developers are so lazy that they didn't care about other data or lets say its tough to retrieve it individually.\n\nYou can ask me something like 'Covid Cases in US' or 'Cases of Covid-19 in US'. \n\nFor the Indian territory, you can ask such as 'Covid Cases in Delhi', etc.\n\nAnd if you think you have symptoms of covid, I'll help to lead you to better facilities. Just type something like 'help covid', 'help for covid symptoms' or 'covid symptoms' with state mentioned.\n\nTo simply get the helpline numbers, just ask 'helpline covid' with state mentioned (India only)" 
  );
}

function handleCheckPincode(){
  //extraction of pincode
  //...
  const pincode = '110078'
  return axios.post('https://data.geoiq.io/dataapis/v1.0/covid/pincodecheck', {
    key: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtYWlsSWRlbnRpdHkiOiJlZHdpbnRvcHBvNjAyNUBnbWFpbC5jb20ifQ.bYMVz6S2Yrcz1izMzDb05A8_LtaHwJHVWsCaDXFEvjM',
    pincode: pincode
  })
  .then(function (res) {
    console.log(res)
    return res.data;
  })
  .catch(function (error) {
    console.log(error);
  });
}

function handleBye(){
  return Promise.resolve(
    `Thanks for giving me the opportunity to help you. Reach out to me if you think I'm worthy to help you ${String.fromCodePoint(0x1F605)}.`
  );
}

function handleGibberish() {
  return Promise.resolve(
    "Wait! You might be asking the wrong thing. Ask me somthing like 'covid cases in US' or 'cases of covid-19 in US'"
  );
}

exports.responseFromWit = responseFromWit;
