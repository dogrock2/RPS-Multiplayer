$().ready(function () {

    var wins;
    var lose;
    var tied;
    const rps = ['r', 'p', 's'];
    const members = ['player2', 'player1'];
    var player;
    var turn;
    var numPlayers;
    var database;
    var connectionsRef;
    var connectedRef;
    var name;
    var oponentName;
    var connected;
    var p1_played;
    var p2_played;
    var oponentVal;
    var cnt;
    var oponentAvail;

    function init() {

        $("#connectB").attr('disabled', true);
        $("#acptBtn").css('visibility', 'hidden');
        $("#rjtBtn").css('visibility', 'hidden');
        $("#nameInput").attr('disabled', true);
        $("#subBtn").attr('disabled', true);
        $("#chatInput").attr('disabled', true);
        $("#playersNamesAvail").css('visibility', 'hidden');
        $('#andDisc').css('color', 'white');
        $("#onlineCntStr").css('color', 'white');
        connected = false;
        numPlayers = 1;
        oponentName = '';
        oponentAvail = false;
        p1_played = false;
        p2_played = false;
        cnt = 0;
        

    } //ends init

    $(".butImg").on("click", function () {
        var playerChoice = $(this).attr('vals');
        player = rps.indexOf(playerChoice); //on child change  
        chngImg(player);
        if (numPlayers === 1)
            singlePlayer();
        if (numPlayers === 2)
            multiPlayer();
    });

    $(".custom-control-input").on("click", function () {
        var radClicked = $(this).attr('id');
        if (radClicked === 'radioStacked2') {
            $('#connectB').attr('disabled', false);
            $('#nameInput').attr('disabled', false);
            $("#playersNamesAvail").css('visibility', 'visible');
            $('#andDisc').css('color', 'black');
            $("#onlineCntStr").css('color', 'black');
            $('#oponentName').text(oponentName);
            numPlayers = 2;
            
            saveSessionScore();
        } else {
            $("#connectB").text('Connect');
            $('#connectB').attr('disabled', true);
            $('#nameInput').attr('disabled', true);
            $("#playersNamesAvail").css('visibility', 'hidden');
            $('#andDisc').css('color', 'white');
            $("#onlineCntStr").css('color', 'white');
            $('#oponentName').text('Computer');
            numPlayers = 1;
            $("#oponentName").text('Computer');
            disconnect();
            postSessionScore();
        }
    });

    $('#subBtn').on("click", function () {
        var chatText = name + ": " + $('#chatInput').val();
        $('#chatInput').val('');
        database.ref("/" + name).update({
            textChat: chatText
        });
        database.ref("/" + oponentName).update({
            textChat: chatText
        });
    });

    $("#connectB").on("click", function () {

        if ($(this).text() === 'Connect') {
            name = $("#nameInput").val().trim();
            if (name === '') {
                setErrMsg("Name cannot be blank.");
                $('#nameInput').val('');
            } else {
                setUserName();
                messenger();
            }
        } else if ($(this).text() === 'Invite') {
            var inv = $('#playersNamesAvail').val();
            if (inv === 'You')
                setErrMsg('Cant invite yourself');
            else {
                $('#textarea').text('Invite sent.\n');
                $('#connectB').attr('disabled', true);
                sendInvite(inv);
            }
        }
    }); //ends connectB onClick

    $("#acptBtn").on("click", function () {

        $("#oponentName").text(oponentName);
        passOponentVal();
        connected = true;
        database.ref("/" + oponentName).update({
            textChat: name + ' accepted your invite',
            invited: false,
            onGame: true
        });
        database.ref("/" + name).update({
            textChat: oponentName + ' is now connected',
            invited: false,
            onGame: true,
            interested: true
        });

        $('#connectB').attr('disabled', true);
        $("#chatInput").attr('disabled', false);
        $("#subBtn").attr('disabled', false);
        $("#acptBtn").css('visibility', 'hidden');
        $("#rjtBtn").css('visibility', 'hidden');

    }); //ends acptBtn

    $("#rjtBtn").on("click", function () {

        $("#oponentName").text('waiting...');
        connected = false;
        database.ref("/" + oponentName).update({
            textChat: name + ' rejected your invite',
            invited: false,
            onGame: false

        });
        database.ref("/" + name).update({
            textChat: 'you rejected the invite',
            invited: false,
            onGame: false,
            interested: false
        });

        $('#connectB').attr('disabled', false);
        $("#acptBtn").css('visibility', 'hidden');
        $("#rjtBtn").css('visibility', 'hidden');

    }); //ends rjtBtn


    function sendInvite(nameInv) {

        database.ref('/' + nameInv + '/onGame').once("value", function (snap) {
               oponentAvail = snap.val();
        });

        if(!oponentAvail)
            database.ref("/" + nameInv).update({
                textChat: name + ' sent you an invite',
                invited: true
            });
        else
           setMsg('Player currently in a GAME.');    

        database.ref('/' + nameInv + '/interested').on("value", function (snap) {
            resultInterested = snap.val();
            if (!resultInterested) {
                $("#oponentName").text('waiting');
                connected = false;
                $('#connectB').attr('disabled', false);
            } else {
                connected = true;
                oponentName = nameInv;
                passOponentVal();
                $("#oponentName").text(nameInv);
                $("#chatInput").attr('disabled', false);
                $("#subBtn").attr('disabled', false);
                $("#connectB").attr('disabled', true);
            }
        }); //ends database ref

    } //ends sendInvite

    function passOponentVal() {

        database.ref('/' + oponentName + '/onGameSelection').on("value", function (snap) {
            var valChosen = snap.val();
            if (valChosen !== null && valChosen !== 'null') {
                oponentVal = valChosen;
                p2_played = true;
                chngImg2(valChosen);
                checkBothPlayers();
            } //ends if
        });

    }

    function initFirebase() {

        var config = {
            apiKey: "AIzaSyBNVtg2XC4rGr-Cq2jBlUnV591TdjuGdno",
            authDomain: "rockpaperscissor-60aca.firebaseapp.com",
            databaseURL: "https://rockpaperscissor-60aca.firebaseio.com",
            projectId: "rockpaperscissor-60aca",
            storageBucket: "rockpaperscissor-60aca.appspot.com",
            messagingSenderId: "513563930918"
        };

        firebase.initializeApp(config); //initializes db
        database = firebase.database(); //create a ref to the db

    } //ends initFirebase

    function messenger() {

        cnt = $('#playersNamesAvail').length - 1;

        database.ref().on("child_added", function (snapshot) {
            if (snapshot.key === name) {
                $('#playersNamesAvail').append("<option> You </option>");
                cnt++;
            } else {
                $('#playersNamesAvail').append("<option val='"+snapshot.key+"'>" + snapshot.key + "</option>");
                cnt++;
            }
            $('#onlineCntTotal').text(cnt);
        }); //ends db ref    

        database.ref().on("child_removed", function (snapshot) {            
                cnt--;
                $('#onlineCntTotal').text(cnt);                 
                $("#onlineCntTotal[val='"+snapshot.key+"']").remove();
        }); //ends db ref
        
        database.ref('/' + name + '/invited').on("value", function (snap) {
            var invite = snap.val();
            if (invite) {
                $("#acptBtn").css('visibility', 'visible');
                $("#rjtBtn").css('visibility', 'visible');
            }

        }); //ends database ref

        database.ref('/' + name + '/textChat').on("value", function (snap) {

            if (connected) {
                $('#textarea').text(snap.val() + '\n');
            } else {
                var toSet = snap.val();
                if (toSet) {
                    oponentName = '';
                    $('#textarea').text(toSet + '\n');
                    for (let y = 0; y < toSet.length; y++)
                        if (toSet.charAt(y) !== ' ')
                            oponentName += toSet.charAt(y);
                        else
                            break;
                } //ends if(toSet)
            } //ends 1st if
        }); //ends database ref


    } //ends messenger


    function setUserName() {

        database.ref().once("value", function (snapshot) {
            if (snapshot.child("/" + name).exists()) {
                setErrMsg("Name already chosen. Choose another.");
            } else {
                database.ref("/" + name).set({
                    onGame: false,
                    onGameSelection: 'null',
                    textChat: '',
                    invited: false,
                    interested: false
                });
                setMsg("Welcome " + name);
                $("#connectB").text('Invite');
                $("#nameInput").attr('disabled', true);
            }
        }); //ends snapshot

    } //ends setUserName



    function saveSessionScore() {

        sessionStorage.setItem("wins", $("#wins").text());
        sessionStorage.setItem("lose", $("#loses").text());
        sessionStorage.setItem("tied", $("#tied").text());
        clearSinglePlayerScore();

    } //ends saveSessionScore

    function postSessionScore() {

        wins = parseInt(sessionStorage.wins);
        lose = parseInt(sessionStorage.lose);
        tied = parseInt(sessionStorage.tied);
        $("#wins").text(wins);
        $("#loses").text(lose);
        $("#tied").text(tied);

    } //ends postSessionScore

    function clearSinglePlayerScore() {

        wins = 0;
        lose = 0;
        tied = 0;
        $("#wins").text(wins);
        $("#loses").text(lose);
        $("#tied").text(tied);

    } //ends clearScore

    function multiPlayer() {

        database.ref("/" + name).update({
            onGameSelection: player //player is the value played            
        });
        p1_played = true;
        checkBothPlayers();
    } //ends multiPlayer

    function checkBothPlayers() {

        if (p1_played === true && p2_played === true) {
            validateWinner(oponentVal);
            p1_played = false;
            p2_played = false;
        }
    } //ends checkBothPlayers

    function singlePlayer() {

        var compRandom = (Math.ceil(Math.random() * 3) - 1);
        validateWinner(compRandom);
        chngImg2(compRandom);

    } //ends singlePlayer

    function validateWinner(choice) {

        turn = [choice, player];
        var a = 0;
        var b = 1;

        if (choice === player) {
            var currentTiedVal = parseInt($("#tied").text());
            $("#tied").text(currentTiedVal + 1);            
            setMsg("TIED!!!");
            imgEffect(3);
        } else {
            for (var i = 0; i < 2; i++) {
                if ((turn[a] === 0) && (turn[b] === 1))
                    setVal(members[b]);
                if ((turn[a] === 0) && (turn[b] === 2))
                    setVal(members[a]);
                if ((turn[a] === 1) && (turn[b] === 2))
                    setVal(members[b]);

                a = 1;
                b = 0;
            } //ends for loop
        } //ends else
    } //ends validateWinner

    function setVal(daWinner) {

        if (daWinner === 'player2') {
            var currentLoseVal = parseInt($("#loses").text());
            $("#loses").text(currentLoseVal + 1);
            if (numPlayers === 1)
                setMsg("COMPUTER WINS");
            else
                setMsg("Player 2 WINS");
            imgEffect(2);
        } else {
            var currentWinVal = parseInt($("#wins").text());
            $("#wins").text(currentWinVal + 1);
            setMsg("YOU WIN");
            imgEffect(1);
        }

    } //ends setVal

    function chngImg(plyr) {
        if (plyr === 0)
            $('#pImg').attr('src', 'assets/images/rock.png');
        else if (plyr === 1)
            $('#pImg').attr('src', 'assets/images/paper.png');
        else if (plyr === 2)
            $('#pImg').attr('src', 'assets/images/scissors.png');
    }

    function chngImg2(rnd) {
        if (rnd === 0)
            $('#cImg').attr('src', 'assets/images/rock.png');
        else if (rnd === 1)
            $('#cImg').attr('src', 'assets/images/paper.png');
        else if (rnd === 2)
            $('#cImg').attr('src', 'assets/images/scissors.png');

    } //ends chngImg

    function imgEffect(valIn) {

        if (valIn === 1)
            $('#pImg').css('border', '15px solid blue');
        if (valIn === 2)
            $('#cImg').css('border', '15px solid red');
        if (valIn === 3) {
            $('#cImg').css('border', '15px solid yellow');
            $('#pImg').css('border', '15px solid yellow');
        }
        setTimeout(function () {
            $('#cImg').css('border', 'initial');
            $('#pImg').css('border', 'initial');
        }, 200);

    } //ends imgEffect

    function setMsg(msgVal) {
        $("#message").css('color', '#000'); //black color
        $("#message").text(msgVal);
    } //ends setMsg

    function setErrMsg(msgVal) {
        $("#message").css('color', '#ff0000'); //red color
        $("#message").html("Error: <i>" + msgVal + "</i>");
    } //ends setMsg

    function disconnect() {

        setMsg('Disconnected');
        if(oponentName)
            database.ref().once("value", function (snapshot) {                
                if (snapshot.child('/' + oponentName).exists()) {                    
                    database.ref('/' + oponentName).update({
                        textChat: name + ' disconnected.'
                    }).then( function(){
                        database.ref("/" + name).remove();
                    });
                }//ends if
                });
        else      
            database.ref("/" + name).remove();  
              
        $('#playersNamesAvail').html('');
        init();        
        $('#onlineCntTotal').text(cnt);
    } //ends disconnect
    
    init();
    initFirebase();

    $(window).unload(function () {
        disconnect();        
    });

}); //ends ready