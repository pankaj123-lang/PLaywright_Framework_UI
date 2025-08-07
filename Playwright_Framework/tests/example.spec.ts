const data = {
  "Project_1": {
    "Dashboard_Access": {
      "steps": [
        {
          "action": "goto",
          "selector": "",
          "value": "https://mira-qa.morningstar.com/"
        },
        {
          "action": "fill",
          "selector": "id=\"email\"",
          "value": "pankaj.mahanta@morningstar.com"
        },
        {
          "action": "fill",
          "selector": "id=\"password\"",
          "value": "Mumbai@2025"
        },
        {
          "action": "click",
          "selector": "//*[@id=\"uim-ul-legacy-login\"]/div[1]/div/div/div/form/button",
          "value": ""
        }
      ]
    },
    "User_Login": {
      "steps": [
        {
          "action": "goto",
          "selector": "",
          "value": "https://mira-qa.morningstar.com/"
        },
        {
          "action": "fill",
          "selector": "id=\"email\"",
          "value": "pankaj.mahanta@morningstar.com"
        },
        {
          "action": "fill",
          "selector": "id=\"password\"",
          "value": "Mumbai@2025"
        },
        {
          "action": "click",
          "selector": "//*[@id=\"uim-ul-legacy-login\"]/div[1]/div/div/div/form/button",
          "value": ""
        }
      ]
    }
  }
};

const projectName = Object.keys(data)[0]; // Get the first project name
const tests = data[projectName];
for(const testName of Object.keys(tests)){
  const steps = tests[testName]?.steps;
  console.log(`Running test: ${testName}`);
  console.log(`Steps: ${steps}`);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`Step ${i + 1}: Action - ${step.action}, Selector - ${step.selector}, Value - ${step.value}`);
    
  }
  
  
}