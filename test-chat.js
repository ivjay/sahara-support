const { sendMessage } = require("./app/actions/chat");

async function test() {
    console.log("Testing sendMessage...");
    try {
        const result = await sendMessage("hi");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error during sendMessage:", error);
    }
}

test();
