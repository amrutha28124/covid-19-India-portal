const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
       SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "abcdef");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    staterId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcdef", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const getStatesQuery = `
            SELECT
             *
            FROM
                state
            ORDER BY
                state_id;`;
        const statesArray = await db.all(getStatesQuery);
        response.send(
          statesArray.map((eachState) =>
            convertDbObjectToResponseObject(eachState)
          )
        );
      }
    });
  }
});

app.get("/states/:stateId/", async (request, response) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcdef", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { stateId } = request.params;
        const getStateQuery = `
            SELECT
            *
            FROM
              state
            WHERE
                state_id = ${stateId};`;
        const state = await db.get(getStateQuery);
        response.send(convertDbObjectToResponseObject(state));
      }
    });
  }
});

app.post("/districts/", async (request, response) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcdef", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const districtDetails = request.body;
        const {
          districtName,
          stateId,
          cases,
          cured,
          active,
          deaths,
        } = districtDetails;
        const addDistrictQuery = `
            INSERT INTO
            district (district_name,state_id,cases,cured,active,deaths)
            VALUES
            (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            );`;

        const dbResponse = await db.run(addDistrictQuery);
        const districtId = dbResponse.lastID;
        response.send("District Successfully Added");
      }
    });
  }
});

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcdef", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        const getDistrictQuery = `SELECT * FROM district WHERE district_id= ${districtId};`;
        const district = await db.get(getDistrictQuery);
        response.send(convertDistrictObjectToResponseObject(district));
      }
    });
  }
});

app.delete("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcdef", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
        await db.run(deleteDistrictQuery);
        response.send("District Removed");
      }
    });
  }
});

app.put("/districts/:districtId/", async (request, response) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcdef", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { districtId } = request.params;
        const districtDetails = request.body;
        const {
          districtName,
          stateId,
          cases,
          cured,
          active,
          deaths,
        } = districtDetails;
        const updateDistrictQuery = `
            UPDATE 
                district 
            SET 
                district_name='${districtName}', 
                state_id= ${stateId}, 
                cases= ${cases}, 
                cured = ${cured}, 
                active= ${active}, 
                deaths= ${deaths}
            WHERE 
                district_id = ${districtId};`;
        await db.run(updateDistrictQuery);
        response.send("District Details Updated");
      }
    });
  }
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "abcdef", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { stateId } = request.params;
        const getStateStatsQuery = `
            SELECT
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
            FROM
            district
            WHERE
            state_id=${stateId};`;
        const stats = await db.get(getStateStatsQuery);
        response.send({
          totalCases: stats["SUM(cases)"],
          totalCured: stats["SUM(cured)"],
          totalActive: stats["SUM(active)"],
          totalDeaths: stats["SUM(deaths)"],
        });
      }
    });
  }
});
