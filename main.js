/// <reference path="jquery-3.6.1.js" />

"use strict";

$(() => {

    let loadNow;
    displayCurrenciesLink();

    $("#currenciesLink").click(function() {
        clearInterval(loadNow);
        displayCurrenciesLink();
    });

    $("#reportsLink").click(async function() {
        clearInterval(loadNow);

        $(".currencies").hide();
        $(".about").hide();
        $(".reports").show();

        const checkList = localStorage.getItem("checkList");

        if(checkList) {
            const listParse = JSON.parse(checkList);

            if(listParse.length > 0) {
                const updatedData = await getJson("https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + listParse + "&tsyms=USD");
                displayReports(listParse, updatedData);

                return;
            }
        }

        displayErrReports();
    });

    $("#aboutLink").click(function() {
        clearInterval(loadNow);

        $(".currencies").hide();
        $(".reports").hide();
        $(".about").show();

        $(".about").html(`
            <p class="aboutText">
                Cryptocurrency, sometimes called crypto-currency or crypto,<br>
                is any form of currency that exists digitally or virtually<br>
                and uses cryptography to secure transactions.<br>
                <b>"Crypto Info"</b> is a single page application for showing real
                time value of crypto currencies.
            </p>

            <p class="aboutText">
                <h2>Used With:</h2>
                HTML5 & Bootstrap, CSS3, JavaScript &rarr; jQuery, AJAX(RESTful API)
            </p>

            <p class="aboutText">
                <img class="aboutImg" src="assets/images/ofek.JPG">
                <br />
                &rarr; Created by Ofek Sabag, Full Stack Web Developer.<br>
                <span class="icons">
                    <a href="https://github.com/ofeksabag" target="_blank"><i class="bi bi-github"></i></a>
                    <a href="https://www.linkedin.com/in/ofek-sabag-3b6b44242/" target="_blank"><i class="bi bi-linkedin"></i></a>
                </span>
            </p>
        `);
    });

    $("#search").on("keyup", function() {
        clearInterval(loadNow);

        $(".reports").hide();
        $(".about").hide();
        $(".currencies").show();

        const search = $(this).val();
        $(".cardBox").hide();
        $(`.cardBox .coinSymbol span:contains(${search.toLowerCase()})`).parent().parent().parent().show();
    });

    $("#closeModal").click(function() {
        $(".modal").hide();
    });

    function displayReports(list, updatedData) {
        const dataPoints = {};

        var options = {
            exportEnabled: true,
            animationEnabled: true,
            title:{
                text: list + " to USD:"
            },
            axisX: {
                title: "Coins:"
            },
            toolTip: {
                shared: true
            },
            legend: {
                cursor: "pointer",
                itemClick: toggleDataSeries
            },
            data: []
        };

        const now = new Date();

        for(const item in updatedData) {
            dataPoints[item] = [{ x: now, y: updatedData[item].USD }];

            const itemObj = {
                type: "spline",
                name: item,
                showInLegend: true,
                xValueFormatString: "MMM YYYY",
                yValueFormatString: "#,##0 Units",
                dataPoints: dataPoints[item]
            };

            options.data.push(itemObj);
        }

        loadNow = setInterval(async () => {
            const newData = await getJson("https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + list + "&tsyms=USD");
            const now = new Date();

            for(const item in newData) {
                dataPoints[item].push(
                    { x: now , y: newData[item].USD }
                );
            }

            chart.render();
        }, 2000);

        const chart = new CanvasJS.Chart("reports", options);
        $(".reports").css("display", "block");

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }
    }

    function displayErrReports() {
        $(".reports").css("display","grid").html("You don't have saved coins yet.");
    }

    async function displayCurrenciesLink() {
        const coins = await getJson("https://api.coingecko.com/api/v3/coins");

        displayCoins(coins);
    }

    function displayCoins(coins) {
        $(".reports").hide();
        $(".about").hide();
        $(".currencies").show();

        $(".currencies").html('');
        for (const coin of coins) {
            const cardBox = $(`<div class="cardBox">`).append(
                $(`<div class="cardContent">`).append(`
                    <div class="coinSymbol">
                        <img src="${coin.image.small}">
                        <span>${coin.symbol}</span>
                    </div>
                `).append(
                    $(`<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${coin.symbol}"></div>`)
                    .ready(() => {
                        checkListFromStorage(coin.symbol);
                    })
                    .on("click", () => {
                        addToCheckList(coin.symbol);
                    })
                ).append(`
                    <div class="coinName">
                        <span>${coin.name}</span>
                    </div>
                `).append(
                    $(`<button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${coin.id}" aria-expanded="false" aria-controls="collapseExample">More Info</button>`)
                    .on("click", () => {
                        moreInfo(coin.id);
                    })
                )
            );

            const collapse = $(`
                <div class="collapse" id="collapse_${coin.id}">
                    <div class="spinner-border" role="status"></div>
                </div>
            `);

            $(".currencies").css("display","grid");
            cardBox.append(collapse);
            $(".currencies").append(cardBox);
        }
    }

    function checkListFromStorage(id) {
        const checkList = localStorage.getItem("checkList");

        if(checkList) {
            const list = JSON.parse(checkList);
            for(const item of list) {
                if(item === id) {
                    $(`#${item}`).prop("checked", true);
                }
            }
        }
    }

    function addToCheckList(id) {
        const checkList = localStorage.getItem("checkList");

        if(checkList) {
            const listParse = JSON.parse(checkList);
            const findId = listParse.find(symbol => symbol === id);

            if(findId) {
                $(`#${id}`).prop("checked", false);
                const index = listParse.indexOf(id);
                listParse.splice(index, 1);
                localStorage.setItem("checkList", JSON.stringify(listParse));
                return;
            }

            else {
                if(listParse.length === 5) {
                    $(".modal").show();
                    $("#displayCoinsToChange").html('');

                    for(const item of listParse) {
                        $("#displayCoinsToChange").append(`
                            <div id="containerItem">
                                ${item}
                            </div>
                        `)
                        .append(
                            $(`
                                <div id="containerSwitch">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="${item}">
                                    </div>
                                </div>
                                <br />
                            `)
                            .ready(function() {
                                $(`#${item}`).prop("checked", true);
                            })
                            .on("click", function() {
                                $(`#${item}`).prop("checked", false);
                                $(".modal").hide();
                                const index = listParse.indexOf(item);
                                listParse.splice(index, 1);
                                listParse.push(id);
                                localStorage.setItem("checkList", JSON.stringify(listParse));
                                location.reload();
                            })
                        )
                    };

                    $(`#${id}`).prop("checked", false);
                    return;
                }
                listParse.push(id);
                localStorage.setItem("checkList", JSON.stringify(listParse));
                return;
            }

        }
        const newList = [];
        newList.push(id);
        localStorage.setItem("checkList", JSON.stringify(newList));
    }


    async function moreInfo(id) {
        const coinInfo = await getJson("https://api.coingecko.com/api/v3/coins/" + id.toLowerCase());
    
        const storage = localStorage.getItem("info");
        const coinStorage = JSON.parse(storage);

        const infoTime = localStorage.getItem("infoTime");
        const diffTime = diffMinutes(new Date(infoTime), new Date());

        if(infoTime && diffTime <= 2 && storage && coinStorage.id === coinInfo.id) {
            displayMoreInfo(coin);
            return;
        }

        displayMoreInfo(coinInfo);
        const infoStr = JSON.stringify(coinInfo);
        localStorage.setItem("info", infoStr);
        localStorage.setItem("infoTime", new Date());

    }

    function displayMoreInfo(info) {
        $(`#collapse_${info.id}`).html(`
            <hr>
            <h3>Values:</h3>
            <b>USD</b> &rarr; ${info.market_data.current_price.usd}$
            <br>
            <b>EURO</b> &rarr; ${info.market_data.current_price.eur}€
            <br>
            <b>NIS</b> &rarr; ${info.market_data.current_price.ils}₪
            <hr>
        `);
    }

    function diffMinutes(date1, date2) {
        var diff =(date2.getTime() - date1.getTime()) / 1000;
        diff /= 60;
        return Math.abs(Math.round(diff));
    }

    async function getJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    }

});