var express = require("express");
var url = require("url");
var app = express();

const { Client } = require('pg');

app.set("port", (process.env.PORT || 5000));

function PositiveOrNull(x) {
    if (x < 0) { return null }
    return x
}

var DegreePrograms = ["agriculture","architecture","biological","business_marketing","communication","communications_technology","computer","construction","education","engineering","engineering_technology","english","ethnic_cultural_gender","family_consumer_science","health","history","humanities","language","legal","library","mathematics","mechanic_repair_technology","military","parks_recreation_fitness","personal_culinary","philosophy_religious","physical_science","precision_production","psychology","public_administration_social_service","resources","science_technology","security_law_enforcement","social_science","theology_religious_vocation","transportation","visual_performing"]

function OrganizeSchool(json) {
    var school = {
        key: json.id,
        name: json.name,
        url: json.url,
        location: {
            city: json.city,
            state: json.state
        },
        demographics: {
            size: json.demographics_size,
            male: json.demographics_male,
            female: json.demographics_female
        },
        repayment: {
            "1_yr": PositiveOrNull(json.repayment_1),
            "3_yr": PositiveOrNull(json.repayment_3),
            "5_yr": PositiveOrNull(json.repayment_5),
            "7_yr": PositiveOrNull(json.repayment_7),
            median: PositiveOrNull(json.repayment_median)
        },
        admissions: {
            act: {
                composite: {
                    "25": PositiveOrNull(json.act_comp_25),
                    "50": PositiveOrNull(json.act_comp_50),
                    "75": PositiveOrNull(json.act_comp_75)
                }
            },
            sat: {
                avg: PositiveOrNull(json.sat_avg)
            }
        },
        salary: {
            starting: {
                "10": PositiveOrNull(json.salary_s_10),
                "25": PositiveOrNull(json.salary_s_25),
                "50": PositiveOrNull(json.salary_s_50),
                "75": PositiveOrNull(json.salary_s_75),
                "90": PositiveOrNull(json.salary_s_90)
            },
            eventual: {
                "10": PositiveOrNull(json.salary_e_10),
                "25": PositiveOrNull(json.salary_e_25),
                "50": PositiveOrNull(json.salary_e_50),
                "75": PositiveOrNull(json.salary_e_75),
                "90": PositiveOrNull(json.salary_e_90)
            }
        },
        tuition: {
            in_state: PositiveOrNull(json.tuition_in),
            out_state: PositiveOrNull(json.tuition_out),
            pell_grant_rate: PositiveOrNull(json.tuition_pell)
        },
        programs: {}
    }
    for (var i = 0; i < DegreePrograms.length; i++) {
        var dg = DegreePrograms[i];
        if (json[dg]) {
            school.programs[dg] = true
        }
    }
    return school
}

function BuildStatement(equals, fields, ordered) {
    var stmt = "SELECT * FROM scorecard";

    if (equals.length + fields.length > 0) {
        stmt += " WHERE ";
    }

    var e = [];
    equals.forEach(function(eq) { e.push(eq[0] + " = " + eq[1]); });

    var f = [];
    fields.forEach(function(field) { f.push(field + " = true"); });

    if (e.length > 0) {
        stmt += e.join(", ");
        if (f.length > 0) {
            stmt += ", "
        }
    }
    if (f.length > 0) {
        stmt += f.join(", ");
    }

    if (ordered.length > 0) {
        stmt += " ORDERED BY " + ordered + " DESC";
    }

    return stmt + ";";
}

app.get("/v1", function(request, response) {
    var query = url.parse(request.url, true).query;
    var fields = query.fields || [];
    if (fields.length > 0) { fields = fields.split(","); }
    delete query.fields;
    var equals = [];
    var ordered = "";
    for (var k in query) {
        switch (k) {
            case "state":
                equals.push([k, "'" + query[k].toUpperCase() + "'"]);
                break;
            case "ordered":
                ordered = query[k];
                break;
            default: console.log("Unknown query parameter: " + k);
        }
    }
    var stmt = BuildStatement(equals, fields, ordered);
    console.log(stmt);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });

    client.connect();
    client.query(stmt)
        .then((res) => {
            var schools = []
            for (var i = 0; i < res.rows.length; i++) {
                schools.push(OrganizeSchool(res.rows[i]))
            }
            response.json({ error: false, results: schools })
        })
        .catch((e) => {
            console.log(e.stack);
            response.json({ error: true })
        })
        .then(() => client.end())
});

app.listen(app.get("port"), function() {
    console.log("Node app is running on port", app.get("port"));
});
