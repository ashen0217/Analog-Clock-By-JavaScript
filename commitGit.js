// Add your instrumentation key or use the APPLICATIONINSIGHTSKEY environment variable on your production machine to start collecting data.
import ai from "applicationinsights";
import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import { Random } from "random";

// initialize Application Insights
ai.setup(process.env.APPLICATIONINSIGHTSKEY || "your_instrumentation_key").start();

const path = "./data.json";
const random = new Random();

const markComits = async (n) => {
    if (n === 0) {
        try {
            await simpleGit().push();
            return;
        } catch (error) {
            console.error("Error pushing to Git:", error);
            return;
        }
    }

    const x = random.int(0, 54);
    const y = random.int(0, 6);
    const date = moment().subtract(1, "y").add(1, "d").add(x, "w").add(y, "d").format("YYYY-MM-DD HH:mm:ss");

    const data = {
        date: date,
    };

    console.log(date);

    try {
        await jsonfile.writeFile(path, data);
        await simpleGit().add([path]).commit(`Commit on ${date}`, { "--date": date });
        await simpleGit().push();
        // await the recursive call so errors can be handled in this call stack
        await markComits(n - 1);
    } catch (error) {
        console.error("Error during commit:", error);
    }
};

markComits(50);
