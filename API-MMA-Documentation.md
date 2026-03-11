# API 

## Introduction

Welcome to API-MMA! You can use our API to access all API endpoints, which can get information about MMA (Mixed Martial Arts).

We have language bindings in C, C#, c URL, Dart, Go, Java, Javascript, Node Js, Objective-c, OCaml, Php, Power Shell, Python, Ruby, Shell and Swift! You can view code examples in the dark area to the right, and you can switch the programming language of the examples with the tabs in the top right.

## Authentication

We uses API keys to allow access to the API. You can register a new API key directly on ourdashboard.

API-SPORTS:https://v1.mma.api-sports.io/

Our API expects for the API key to be included in all API requests to the server in a header that looks like the following:

> Make sure to replace Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx Xxwith your API key.

Make sure to replace Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx Xxwith your API key.

REQUESTS HEADERS & CORS

The API is configured to work only with GETrequests and allows only the headers listed below:

* x-apisports-key

If you make non-GET requests or add headers that are not in the list, you will receive an error from the API.

Some frameworks(especially in JS, node JS..)automatically add extra headers, you have to make sure to remove them in order to get a response from the API.

### API-SPORTS Account

If you decided to subscribe directly on our site, you have a dashboard at your disposal at the following url:dashboard

It allows you to:

* To follow your consumption in real time
* Manage your subscription and change it if necessary
* Check the status of our servers
* Test all endpoints without writing a line of code.

You can also consult all this information directly through the API by calling the endpointstatus.

> This call does not count against the daily quota.

This call does not count against the daily quota.

```json
get("https://v1.mma.api-sports.io/status");// response{"get":"status","parameters":[],"errors":[],"results":1,"response":{"account":{"firstname":"xxxx","lastname":"XXXXXX","email":"xxx@xxx.com"},"subscription":{"plan":"Free","end":"2020-04-10T23:24:27+00:00","active":true},"requests":{"current":12,"limit_day":100}}}
```

### Headers sent as response

When consuming our API, you will always receive the following headers appended to the response:

* x-ratelimit-requests-limit: The number of requests allocated per day according to your subscription.
* x-ratelimit-requests-remaining: The number of remaining requests per day according to your subscription.
* X-Rate Limit-Limit: Maximum number of API calls per minute.
* X-Rate Limit-Remaining: Number of API calls remaining before reaching the limit per minute.

### Dashboard

![dashboard](https://www.api-football.com/public/img/news/baseball-dashboard.png)
*Schermata della dashboard di API-Sports. Mostra il pannello di controllo con statistiche di utilizzo, abbonamento attivo e accesso rapido agli endpoint.*

### Requests

![requests](https://www.api-football.com/public/img/news/baseball-requests.png)
*Grafico delle richieste API nel tempo. Visualizza il numero di chiamate effettuate per giorno con indicatori di quota rimanente.*

### Live tester

![requests](https://www.api-football.com/public/img/news/baseball-live.png)
*Grafico delle richieste API nel tempo. Visualizza il numero di chiamate effettuate per giorno con indicatori di quota rimanente.*

## Architecture

![Architecture](https://www.api-football.com/public/img/news/archi-mma.jpg)
*Diagramma dell'architettura dell'API API. Mostra la gerarchia delle entità: Seasons → Leagues → Games, Teams, Players, Standings.*

## Logos / Images

Calls to logos/images do not count towards your daily quota and are provided for free. However these calls are subject to arate per second & minute, it is recommended to save this data on your side in order not to slow down or impact the user experience of your application or website. For this you can use CDNssuch asbunny.net.

We have a tutorial availablehere, which explains how to set up your own media system with Bunny CDN.

Logos, images and trademarks delivered through the API are provided solely for identification and descriptive purposes (e.g., identifying leagues, teams, players or venues). We does not own any of these visual assets, and no intellectual property rights are claimed over them. Some images or data may be subject to intellectual property or trademark rights held by third parties (including but not limited to leagues, federations, or clubs). The use of such content in your applications, websites, or products may require additional authorization or licensing from the respective rights holders. You are fully responsible for ensuring that your usage of any logos, images, or branded content complies with applicable laws in your country or the countries where your services are made available.We are not affiliated with, sponsored by, or endorsed by any sports league, federation, or brand featured in the data provided.

## Sample Scripts

Here are some examples of how the API is used in the main development languages.

You have to replace{endpoint}by the real name of the endpoint you want to call, likefightsorfightersfor example. In all the sample scripts we will use thefightsendpoint as example.

Also you will have to replace Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx Xxwith your API-KEY provided in thedashboard.

The following languages are supported: **C**, **C#**, **c URL**, **Dart**, **Go**, **Java**, **Java Script**, **Node Js**, **Objective-c**, **OCaml**, **PHP**, **Power Shell**, **Python**, **Ruby**, **Shell**, **Swift**.

Replace `{endpoint}` with the desired endpoint name (e.g., `leagues`, `games`) and `Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx Xx` with your API key.

## CDN

## Databases Solutions

## Widgets

API-SPORTS widgets allow you to easily displaydynamic sports dataon your website.

They are designed to be:

* Ultra-modular: each component is autonomous
* Customisable: language, theme, content, behaviour
* Easy to integrate: no framework required, a simple HTML tag is all you need

They use request from your API-SPORTS account and work withall plans, including the free plan.

Find all the documentation on widgetshere

![Widget Preview](https://api-sports-media-temp.b-cdn.net/widgets/mma.png)
*Esempio di widget per API. Mostra un componente di visualizzazione partite integrato in una pagina web.*

## API Endpoints

### Timezone

#### timezone

Returns the list of timezone set that can be used in the endpointsfights,fights/statistics,fights/statistics/fightersandodds.

Parameters:This endpoint does not require any parameters.

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `x-apisports-key` | string | Yes | Your API-SPORTS Key |

**Response 200**

```json
{
    "get": "timezone",
    "parameters": [],
    "errors": [],
    "results": 425,
    "response": [
        "Africa/Abidjan",
        "Africa/Accra",
        "Africa/Addis_Ababa",
        "Africa/Algiers",
        "Africa/Asmara",
        "Africa/Bamako"
    ]
}
```

### Seasons

#### seasons

Return the list of all available seasons.

All seasons are only4-digit keys.

Allseasonscan be used in other endpoints as parameter.

Parameters:This endpoint does not require any parameters.

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `x-apisports-key` | string | Yes | Your API-SPORTS Key |

**Response 200**

```json
{
    "get": "seasons",
    "parameters": [],
    "errors": [],
    "results": 2,
    "response": [
        2022,
        2023
    ]
}
```

### Categories

#### categories

Return the list of all available categories.

Categories can be used as parameters in endpointfightsandfighters.

Parameters:You can call this endpoint without any parameters to get the complete list.

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `search` | string | No | The name of the category |

**Response 200**

```json
{
    "get": "categories",
    "parameters": [],
    "errors": [],
    "results": 18,
    "response": [
        "Bantamweight",
        "Catch Weight",
        "Catchweight",
        "Featherweight",
        "Flyweight",
        "Heavyweight",
        "Light Heavyweight",
        "Lightweight",
        "Middleweight",
        "Open Weight",
        "Super Heavyweight",
        "Welterweight",
        "Women's Bantamweight",
        "Women's Catch Weight",
        "Women's Featherweight",
        "Women's Flyweight",
        "Women's Lightweight",
        "Women's Strawweight"
    ]
}
```

### Teams

#### teams

Return the list of available teams.

The teamidareuniquein the API.

Parameters:You can call this endpoint without any parameters to get the complete list.

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No | The id of the team |
| `search` | string | No | The name of the team |

**Response 200**

```json
{
    "get": "teams",
    "parameters": [],
    "errors": [],
    "results": 722,
    "response": [
        {
            "id": 1,
            "name": "MMA LAB"
        },
        {
            "id": 2,
            "name": "Fortis MMA"
        },
        {
            "id": 3,
            "name": "Alliance MMA"
        },
        {
            "id": 4,
            "name": "BMF Ranch"
        },
        {
            "id": 5,
            "name": "Nunes"
        },
        {
            "id": 6,
            "name": "Five Rounds"
        },
        {
            "id": 7,
            "name": "Treigning Lab"
        },
        {
            "id": 8,
            "name": "Rubao Carioca BJJ"
        },
        {
            "id": 9,
            "name": "Hakuilua"
        },
        {
            "id": 10,
            "name": "Combat Sports Academy"
        },
        {
            "id": 11,
            "name": "Jesus is Lord"
        },
        {
            "id": 12,
            "name": "Glory MMA & Fitness"
        },
        {
            "id": 13,
            "name": "Long Island MMA"
        },
        {
            "id": 14,
            "name": "Roufusport"
        },
        {
            "id": 15,
            "name": "Arizona Combat Sports"
        },
        {
            "id": 16,
            "name": "Factory X Muay Thai"
        },
        {
            "id": 17,
            "name": "Syndicate MMA"
        },
        {
            "id": 18,
            "name": "Saekson Muay Thai"
        },
        {
            "id": 19,
            "name": "Elevation Fight"
        },
        {
            "id": 20,
            "name": "Fight Ready"
        },
        {
            "id": 21,
            "name": "American Top"
        },
        {
            "id": 22,
            "name": "Bellmore Kickboxing Academy"
        }
    ]
}
```

### Fighters

#### fighters

Return a set of data about the fighters.

The fighteridareuniquein the API and  keep it among all the competitions/fights in which they participate.

You can use fighteridin other endpoint likefights,fights/statistics/fightersas parameter.

Parameters:This endpoint requires at least one of theses parameters : id, team, name, category, search.

This endpoint is updated every day

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No | The id of the fighter |
| `team` | integer | No | The id of the team |
| `name` | string | No | The name of the fighter |
| `category` | string | No | The category of the fighter |
| `search` | string | No | The name of the fighter |

**Response 200**

```json
{
    "get": "fighters",
    "parameters": {
        "id": "691"
    },
    "errors": [],
    "results": 1,
    "response": [
        {
            "id": 691,
            "name": "Conor Mc Gregor",
            "nickname": "The Notorious",
            "photo": "https://media-1.api-sports.io/mma/fighters/691.png",
            "gender": "M",
            "birth_date": "1999-11-30",
            "age": 33,
            "height": "5' 9'",
            "weight": "156 lbs",
            "reach": "74'",
            "stance": "Southpaw",
            "category": "Lightweight",
            "team": {
                "id": 40,
                "name": "SBG Ireland"
            },
            "last_update": "2023-08-30T17:22:52+00:00"
        }
    ]
}
```

#### records

Return the fighter's career statistics.

Parameters:This endpoint requires at least one parameter.

This endpoint is updated every day

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes | The id of the fighter |

**Response 200**

```json
{
    "get": "fighters/records",
    "parameters": {
        "id": "691"
    },
    "errors": [],
    "results": 1,
    "response": [
        {
            "fighter": {
                "id": 691,
                "name": "Conor Mc Gregor",
                "photo": "https://media-1.api-sports.io/mma/fighters/691.png"
            },
            "total": {
                "win": 22,
                "loss": 6,
                "draw": 0
            },
            "ko": {
                "win": 19,
                "loss": 2
            },
            "sub": {
                "win": 1,
                "loss": 4
            }
        }
    ]
}
```

### Fights

#### fights

Return the list of fights according to the given parameters.

For all requests to games you can add the query parametertimezoneto your request in order to retrieve the list of fights in the timezone of your choice like“Europe/London“. In case the timezone is not recognized, empty or is not part of the endpointtimezonelist, the UTCvalue will be applied by default

To know the list of available timezones you have to use the endpointtimezone.

Available Status

Parameters:This endpoint requires at least one of these parameters : id, date, season, fighter.

Fights are updated every 30 seconds

* NS : Not Started
* IN : Intros
* PF : Pre-fight
* LIVE : In Progress
* EOR : End of Round
* FT : Finished
* WO : Walkouts
* CANC : Cancelled (Fight cancelled and not rescheduled)
* PST : Postponed (Fight postponed and waiting for a new Fight date)

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No | The id of the fight |
| `date` | string | No | A valid date |
| `season` | integer | No | A valid season |
| `fighter` | integer | No | The id of the fighter |
| `category` | string | No | The name of the category |
| `timezone` | string | No | A valid timezone |

**Response 200**

```json
{
    "get": "fights",
    "parameters": {
        "date": "2023-08-26"
    },
    "errors": [],
    "results": 13,
    "response": [
        {
            "id": 878,
            "date": "2023-08-26T09:00:00+00:00",
            "time": "09:00",
            "timestamp": 1693040400,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": false,
            "category": "Featherweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 2495,
                    "name": "Jarno Errens",
                    "logo": "https://media-1.api-sports.io/mma/teams/2495.png",
                    "winner": false
                },
                "second": {
                    "id": 390,
                    "name": "Seung Woo Choi",
                    "logo": "https://media-1.api-sports.io/mma/teams/390.png",
                    "winner": true
                }
            }
        },
        {
            "id": 875,
            "date": "2023-08-26T09:25:00+00:00",
            "time": "09:25",
            "timestamp": 1693041900,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": false,
            "category": "Women's Flyweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 188,
                    "name": "JJ Aldrich",
                    "logo": "https://media-1.api-sports.io/mma/teams/188.png",
                    "winner": true
                },
                "second": {
                    "id": 914,
                    "name": "Liang Na",
                    "logo": "https://media-1.api-sports.io/mma/teams/914.png",
                    "winner": false
                }
            }
        },
        {
            "id": 877,
            "date": "2023-08-26T09:50:00+00:00",
            "time": "09:50",
            "timestamp": 1693043400,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": false,
            "category": "Welterweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 2613,
                    "name": "Yusaku Kinoshita",
                    "logo": "https://media-1.api-sports.io/mma/teams/2613.png",
                    "winner": false
                },
                "second": {
                    "id": 2530,
                    "name": "Billy Goff",
                    "logo": "https://media-1.api-sports.io/mma/teams/2530.png",
                    "winner": true
                }
            }
        },
        {
            "id": 874,
            "date": "2023-08-26T10:15:00+00:00",
            "time": "10:15",
            "timestamp": 1693044900,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": false,
            "category": "Welterweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 2593,
                    "name": "Rolando Bedoya",
                    "logo": "https://media-1.api-sports.io/mma/teams/2593.png",
                    "winner": false
                },
                "second": {
                    "id": 588,
                    "name": "Song Kenan",
                    "logo": "https://media-1.api-sports.io/mma/teams/588.png",
                    "winner": true
                }
            }
        },
        {
            "id": 873,
            "date": "2023-08-26T10:40:00+00:00",
            "time": "10:40",
            "timestamp": 1693046400,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": false,
            "category": "Middleweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 108,
                    "name": "Michal Oleksiejczuk",
                    "logo": "https://media-1.api-sports.io/mma/teams/108.png",
                    "winner": true
                },
                "second": {
                    "id": 2391,
                    "name": "Chidi Njokuani",
                    "logo": "https://media-1.api-sports.io/mma/teams/2391.png",
                    "winner": false
                }
            }
        },
        {
            "id": 876,
            "date": "2023-08-26T11:05:00+00:00",
            "time": "11:05",
            "timestamp": 1693047900,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": false,
            "category": "Bantamweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 2491,
                    "name": "Garrett Armfield",
                    "logo": "https://media-1.api-sports.io/mma/teams/2491.png",
                    "winner": true
                },
                "second": {
                    "id": 2603,
                    "name": "Toshiomi Kazama",
                    "logo": "https://media-1.api-sports.io/mma/teams/2603.png",
                    "winner": false
                }
            }
        },
        {
            "id": 872,
            "date": "2023-08-26T11:30:00+00:00",
            "time": "11:30",
            "timestamp": 1693049400,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": false,
            "category": "Heavyweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 2390,
                    "name": "Lukasz Brzeski",
                    "logo": "https://media-1.api-sports.io/mma/teams/2390.png",
                    "winner": false
                },
                "second": {
                    "id": 2521,
                    "name": "Waldo Cortes-Acosta",
                    "logo": "https://media-1.api-sports.io/mma/teams/2521.png",
                    "winner": true
                }
            }
        },
        {
            "id": 884,
            "date": "2023-08-26T12:00:00+00:00",
            "time": "12:00",
            "timestamp": 1693051200,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": true,
            "category": "Heavyweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 793,
                    "name": "Parker Porter",
                    "logo": "https://media-1.api-sports.io/mma/teams/793.png",
                    "winner": false
                },
                "second": {
                    "id": 2572,
                    "name": "Junior Tafa",
                    "logo": "https://media-1.api-sports.io/mma/teams/2572.png",
                    "winner": true
                }
            }
        },
        {
            "id": 881,
            "date": "2023-08-26T12:15:00+00:00",
            "time": "12:15",
            "timestamp": 1693052100,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": true,
            "category": "Featherweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 97,
                    "name": "Alex Caceres",
                    "logo": "https://media-1.api-sports.io/mma/teams/97.png",
                    "winner": false
                },
                "second": {
                    "id": 649,
                    "name": "Giga Chikadze",
                    "logo": "https://media-1.api-sports.io/mma/teams/649.png",
                    "winner": true
                }
            }
        },
        {
            "id": 883,
            "date": "2023-08-26T12:30:00+00:00",
            "time": "12:30",
            "timestamp": 1693053000,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": true,
            "category": "Women's Flyweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 30,
                    "name": "Taila Santos",
                    "logo": "https://media-1.api-sports.io/mma/teams/30.png",
                    "winner": false
                },
                "second": {
                    "id": 1331,
                    "name": "Erin Blanchfield",
                    "logo": "https://media-1.api-sports.io/mma/teams/1331.png",
                    "winner": true
                }
            }
        },
        {
            "id": 882,
            "date": "2023-08-26T13:00:00+00:00",
            "time": "13:00",
            "timestamp": 1693054800,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": true,
            "category": "Bantamweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 2442,
                    "name": "Fernie Garcia",
                    "logo": "https://media-1.api-sports.io/mma/teams/2442.png",
                    "winner": false
                },
                "second": {
                    "id": 2592,
                    "name": "Rinya Nakamura",
                    "logo": "https://media-1.api-sports.io/mma/teams/2592.png",
                    "winner": true
                }
            }
        },
        {
            "id": 880,
            "date": "2023-08-26T14:00:00+00:00",
            "time": "14:00",
            "timestamp": 1693058400,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": true,
            "category": "Light Heavyweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 362,
                    "name": "Ryan Spann",
                    "logo": "https://media-1.api-sports.io/mma/teams/362.png",
                    "winner": false
                },
                "second": {
                    "id": 213,
                    "name": "Anthony Smith",
                    "logo": "https://media-1.api-sports.io/mma/teams/213.png",
                    "winner": true
                }
            }
        },
        {
            "id": 879,
            "date": "2023-08-26T14:30:00+00:00",
            "time": "14:30",
            "timestamp": 1693060200,
            "timezone": "UTC",
            "slug": "UFC Fight Night: Holloway vs. The Korean Zombie",
            "is_main": true,
            "category": "Featherweight",
            "status": {
                "long": "Finished",
                "short": "FT"
            },
            "fighters": {
                "first": {
                    "id": 455,
                    "name": "Chan Sung Jung",
                    "logo": "https://media-1.api-sports.io/mma/teams/455.png",
                    "winner": false
                },
                "second": {
                    "id": 256,
                    "name": "Max Holloway",
                    "logo": "https://media-1.api-sports.io/mma/teams/256.png",
                    "winner": true
                }
            }
        }
    ]
}
```

#### results

Return the results from one or several fights.

Parameters:This endpoint requires at least one of theses parameters : id, ids, date.

This endpoint is updated every 30 seconds

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No | The id of the fight |
| `ids` | string | No | One or more fights ids |
| `date` | string | No | A valid date |

**Response 200**

```json
{
    "get": "fights/results",
    "parameters": {
        "ids": "865-878-879"
    },
    "errors": [],
    "results": 3,
    "response": [
        {
            "fight": {
                "id": 865
            },
            "won_type": "SUB",
            "round": 2,
            "minute": "2:39",
            "ko_type": null,
            "target": null,
            "sub_type": "Triangle Choke",
            "score": []
        },
        {
            "fight": {
                "id": 878
            },
            "won_type": "Points",
            "round": 3,
            "minute": "5:00",
            "ko_type": null,
            "target": null,
            "sub_type": null,
            "score": [
                "30-27",
                "29-28",
                "29-28"
            ]
        },
        {
            "fight": {
                "id": 879
            },
            "won_type": "KO",
            "round": 3,
            "minute": "0:23",
            "ko_type": "Punch",
            "target": null,
            "sub_type": null,
            "score": []
        }
    ]
}
```

#### fighters statistics

Return fighters statistics from one or several fights.

Parameters:This endpoint requires at least one of theses parameters : id, ids, date, fighter.

This endpoint is updated every 30 seconds

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No | The id of the fight |
| `ids` | string | No | One or more fights ids |
| `date` | string | No | A valid date |

**Response 200**

```json
{
    "get": "fights/statistics/fighters",
    "parameters": {
        "id": "879"
    },
    "errors": [],
    "results": 2,
    "response": [
        {
            "fight": {
                "id": 879
            },
            "fighter": {
                "id": 455
            },
            "strikes": {
                "total": {
                    "head": 110,
                    "body": 8,
                    "legs": 6
                },
                "power": {
                    "head": 25,
                    "body": 6,
                    "legs": 3
                },
                "takedowns": {
                    "attempt": 1,
                    "landed": 0
                },
                "submissions": 0,
                "control_time": "0:15",
                "knockdowns": 0
            }
        },
        {
            "fight": {
                "id": 879
            },
            "fighter": {
                "id": 256
            },
            "strikes": {
                "total": {
                    "head": 77,
                    "body": 35,
                    "legs": 16
                },
                "power": {
                    "head": 34,
                    "body": 31,
                    "legs": 10
                },
                "takedowns": {
                    "attempt": 0,
                    "landed": 0
                },
                "submissions": 1,
                "control_time": "0:57",
                "knockdowns": 2
            }
        }
    ]
}
```

### Odds

#### odds

Return the list of available odds for fights.

We provide pre-match odds between 1 and 7 days before the fight.

We keep a 7-day history(The availability of odds may vary according to the fights, seasons and bookmakers)

Parameters:This endpoint requires at least one of theses parameters : fight, date.

Odds are updated four times a day

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `fight` | integer | No | The id of the fight |
| `date` | string | No | A valid date |
| `bookmaker` | integer | No | The id of the bookmaker |
| `bet` | integer | No | The id of the bet |

**Response 200**

```json
{
    "get": "odds",
    "parameters": {
        "bookmaker": "2",
        "fight": "878"
    },
    "errors": [],
    "results": 1,
    "response": [
        {
            "fight": {
                "id": 878
            },
            "bookmakers": [
                {
                    "id": 2,
                    "name": "bwin",
                    "bets": [
                        {
                            "id": 2,
                            "name": "Home/Away",
                            "values": [
                                {
                                    "value": "Home",
                                    "odd": "2.30"
                                },
                                {
                                    "value": "Away",
                                    "odd": "1.63"
                                }
                            ]
                        },
                        {
                            "id": 4,
                            "name": "Over/Under",
                            "values": [
                                {
                                    "value": "Over 2.5",
                                    "odd": "1.80"
                                },
                                {
                                    "value": "Under 2.5",
                                    "odd": "1.95"
                                }
                            ]
                        },
                        {
                            "id": 5,
                            "name": "Fight To Go the Distance",
                            "values": [
                                {
                                    "value": "Yes",
                                    "odd": "2.10"
                                },
                                {
                                    "value": "No",
                                    "odd": "1.69"
                                }
                            ]
                        },
                        {
                            "id": 6,
                            "name": "Round Betting",
                            "values": [
                                {
                                    "value": "R1",
                                    "odd": "3.50"
                                },
                                {
                                    "value": "R2",
                                    "odd": "4.75"
                                },
                                {
                                    "value": "R3",
                                    "odd": "7.00"
                                },
                                {
                                    "value": "DT",
                                    "odd": "2.10"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
```

#### bets

Return the list of available bets for odds.

All betsidcan be used in endpointoddsas filters

Parameters:You can call this endpoint without any parameters to get the complete list.

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No | The id of the bet |
| `search` | string | No | The name of the bet |

**Response 200**

```json
{
    "get": "odds/bets",
    "parameters": [],
    "errors": [],
    "results": 20,
    "response": [
        {
            "id": 1,
            "name": "3Way Result"
        },
        {
            "id": 2,
            "name": "Home/Away"
        },
        {
            "id": 3,
            "name": "Asian Handicap"
        },
        {
            "id": 4,
            "name": "Over/Under"
        },
        {
            "id": 5,
            "name": "Fight To Go the Distance"
        },
        {
            "id": 6,
            "name": "Round Betting"
        },
        {
            "id": 7,
            "name": "Fight To Start Round 2"
        },
        {
            "id": 8,
            "name": "Fight To Start Round 3"
        },
        {
            "id": 9,
            "name": "Fight To Start Round 4"
        },
        {
            "id": 10,
            "name": "Fight To Start Round 5"
        },
        {
            "id": 11,
            "name": "Win by Unanimous Decisio"
        },
        {
            "id": 12,
            "name": "Win by Split or Majority Decision"
        },
        {
            "id": 13,
            "name": "Home Win by Unanimous Decision"
        },
        {
            "id": 14,
            "name": "Home Win by Split or Majority Decision"
        },
        {
            "id": 15,
            "name": "Away Win by Unanimous Decision"
        },
        {
            "id": 16,
            "name": "Away Win by Split or Majority Decision"
        },
        {
            "id": 17,
            "name": "Home Win by Submission"
        },
        {
            "id": 18,
            "name": "Home Win by KO/TKO/DQ"
        },
        {
            "id": 19,
            "name": "Away Win by Submission"
        },
        {
            "id": 20,
            "name": "Away Win by KO/TKO/DQ"
        }
    ]
}
```

#### bookmakers

Return the list of available bookmakers for odds.

All bookmakersidcan be used in endpointoddsas filters.

Parameters:You can call this endpoint without any parameters to get the complete list.

**Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No | The id of the bookmaker |
| `search` | string | No | The name of the bookmaker |

**Response 200**

```json
{
    "get": "odds/bookmakers",
    "parameters": [],
    "errors": [],
    "results": 14,
    "response": [
        {
            "id": 1,
            "name": "Marathon"
        },
        {
            "id": 2,
            "name": "bwin"
        },
        {
            "id": 3,
            "name": "Nordic Bet"
        },
        {
            "id": 4,
            "name": "10Bet"
        },
        {
            "id": 5,
            "name": "bet365"
        },
        {
            "id": 6,
            "name": "Unibet"
        },
        {
            "id": 7,
            "name": "Betsson"
        },
        {
            "id": 8,
            "name": "188bet"
        },
        {
            "id": 9,
            "name": "Pncl"
        },
        {
            "id": 10,
            "name": "Come On"
        },
        {
            "id": 11,
            "name": "Betway"
        },
        {
            "id": 12,
            "name": "Betcris"
        },
        {
            "id": 13,
            "name": "888Sport"
        },
        {
            "id": 14,
            "name": "Sbo"
        }
    ]
}
```

