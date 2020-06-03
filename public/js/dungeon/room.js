window.onload = function functionName() { //當頁面載入時，先創建房間的頁面，然後隱藏
  createMapView();
  $("#userDataBkView").hide();
  $("#map-view").hide();
}



var app = {
  chat: function(roomId, username, starnum) {
    var name = document.getElementById("userName");
    var star = document.getElementById("starNumber");
    name.textContent = username;
    star.textContent = starnum;
    var socket = io('/rooms'
      /*, {
            transports: ['websocket']
          }*/
    );

    socket.on('connect', function() {


      socket.emit('join', roomId);

      socket.on('updateUsersList', function(users, i) {
        // console.log(users, i);
        updateUsersList(users, i);
      });


      $(".chat-btn").on('click', function(e) {
        var textareaEle = $("textarea[name='message']");
        var messageContent = textareaEle.val().trim();
        if (messageContent !== '') {
          var message = {
            content: messageContent,
            username: username,
            date: Date.now()
          };

          socket.emit('newMessage', roomId, message);
          textareaEle.val('');
          addMessage(message);
        }
      })



      socket.on('removeUser', function(userId) {
        $('.users-list ul').html('');
      });

      socket.on('addMessage', function(message) {
        addMessage(message);
      });


      $(".removeRoom").click(function() {
        socket.emit("removeRoom", roomId);
        document.location.replace("/lobby"); //用replace就不會讓使用者利用返回鍵進入已刪除的房間
      });

      $(".game-btn").click(function() { //按鈕變顏色、變換text
        if ($(this).html() == "開始") {
          $(this).html("準備");
          socket.emit("start", 1, roomId); //玩家狀態--->1是準備中，0是無狀態
          socket.emit("ready", roomId);
        } else {
          $(this).text("開始");
          socket.emit("start", 0, roomId);
          socket.emit("ready", roomId);
        }
      });


      $(".rooms-btn").click(function() { //按鈕變顏色、變換text
        $("#userDataBkView").toggle();
        $("#map-view").toggle();

      });


      socket.on("ready", function(playerId) {
        var player = "#user-" + playerId + " .status" //把按下準備按鈕的玩家的狀態顯示出來
        $(player).toggle();
      })

      socket.on("go", function() {
        document.location.replace("/lobby/" + roomId + "/dungeon");
      })



      $(".map-grid-item").click(function() {
        $("#userDataBkView").toggle();
        $("#map-view").toggle();
        var mapName = $(this).attr("id");
        $('.Room-map-picture').attr('src', `/img/地圖照片/${mapName}.png`)

        if (mapName == "map1") {
        $(".map-name").html(map1_text)
        } else if (mapName == "map2") {
          $(".map-name").html(map2_text)
        } else if (mapName == "map3") {
          $(".map-name").html(map3_text)
        } else if (mapName == "map4") {
          $(".map-name").html(map4_text)
        }
        socket.emit("MapChange", roomId, mapName);
      });


    })
  }
}

function updateUsersList(user, i) {
  var html = '';
  html = `<li class="clearfix" id="user-${user.userId}">
             <img src="/img/player${i+1}.png" alt="${user.name}" />
             <div class="about">
                <div class="name"> <i class="fa fa-circle online"></i> ${user.name} <span class="status">完成準備</span></div>
             </div>
          </li>`;



  $('.users-list ul').append(html);

  if (user.playerStatus) {
    var player = "#user-" + user.userId + " .status" //把按下準備按鈕的玩家的狀態顯示出來
    $(player).toggle();
  }
  updateNumOfUsers();
}


function updateNumOfUsers() {
  var num = $('.users-list ul li').length;
  $('.chat-num-users').text(num + " User(s)");
}


function addMessage(message) {
  message.date = (new Date(message.date)).toLocaleTimeString();
  var html = `<div>
                        <div class="message-data">
                          <span class="message-data-name">${message.username}</span>
                          <span class="message-data-time">${message.date}</span>
                        </div>
                        <div class="message my-message" dir="auto">${message.content}</div>
              </div>`;

  $(html).hide().appendTo('.chat-history ').slideDown(500); //顯示效果

  // Keep scroll bar down
  $(".chat-history").animate({
    scrollTop: $('.chat-history')[0].scrollHeight
  }, 1000);
}


function createMapView() {
  var html = `<div id="userDataBkView"></div>
              <div id="map-view"></div>`

  $("#center").append(html);
  html = `      <div class="map-bar">選擇地圖</div>
                <input type="button" title="關閉" id="closeDiv" value="X">
                <div class="map-grid">
                <div class="map-grid-item" id="map1" style="background-image:url(${"/img/地圖照片/map1.png"})"></div>
                <div class="map-grid-item" id="map2" style="background-image:url(${"/img/地圖照片/map2.png"})"></div>
                <div class="map-grid-item" id="map3" style="background-image:url(${"/img/地圖照片/map3.png"})"></div>
                <div class="map-grid-item" id="map4" style="background-image:url(${"/img/地圖照片/map4.png"})"></div>
                </div>
                <div class="map-explanation">
                <div class="map-explanationBar">地圖簡介</div>
                <div class="map-name">${map1_text}</div>
                </div>

        `



  $("#map-view").append(html);



  $("#closeDiv").click(function() {
    $("#userDataBkView").hide();
    $("#map-view").hide();
  });
}

function logout() {
  var href = "/logout";
  window.location.replace(href);
}

map1_text = "嗨囉各位玩家，歡迎來到第一關。本關目標：利用輸出函式來回答每<br>一個門的正確答案本關學習項目：printf(.)話說是不是每一個房間裡面<br>的雕像數量都不一樣呢"
map2_text = "哇~終點周圍都是火焰過不去怎麼辦?本關目標：利用輸入函式來向符文<br>台取得正確的觸發器號碼，本關學習項目：scanf(.)、lf-else、for-loop<br>有4個符文台跟一排的觸發器，難道一次要觸發一個以上才可以讓火滅掉嗎?"
map3_text = "新的門出現了，似乎讓四周的燭台熄滅就可以開啟了<br>本關目標：練習使用迴圈得出特定的答案<br>本關學習項目：for-loop、printf(.)<br>總共有4道題目：<br>左上：費氏數列的F(8)~F(11)，其中F(0)=0、F(1)=1<br>左下：由小到大排列210的質因數分解<br>右上：回答大於200的前4個質數<br>右下：大於等於100、小於1000的所有阿姆斯壯數"
map4_text = "寶箱，是寶箱，正解就在寶箱裡面！<br>本關目標：利用指標變數取的存在寶箱裡面的資訊吧<br>本關學習項目：數字排序<br>又是火焰，該不會把觸發器密碼藏在寶箱裡面吧?每一隻手手都會給你4個整數，寶箱的正確密碼好像是由這4個整數組成，究竟是由大到小還是由小到大呢?<br>指令提示：<br>int A[4];<br>char* p;<br>getArray(A);<br>p = openBos(A);"
