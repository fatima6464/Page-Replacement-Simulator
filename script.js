const algorithmSelect = document.getElementById('select-algorithm');
const numOfFramesInput = document.getElementById('num-of-frames');
const refStringInput = document.getElementById('ref-string');
const genRefBtn = document.getElementById('gen-ref');
const stepBtn = document.getElementById('step-btn');
const runAllBtn = document.getElementById('run-all-btn');
const resetBtn = document.getElementById('reset-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const timeline = document.getElementById('timeline');
const output = document.getElementById('output');
const summary = document.getElementById('summary');
const errorMessage = document.getElementById('error-message');
const explanationDiv = document.getElementById('explanation');
const explanationCard = document.getElementById('explanation-card');
const toggleExplanation = document.getElementById('toggle-explanation');

// State for FIFO/LRU
let fifoLruState = {
  refStringArray: [],
  frames: 1,
  currentIndex: 0,
  pageFaults: 0,
  pageHits: 0,
  prevPageFrame: [],
  currentPageFrame: [],
  isRunning: false,
  validationError: '',
  replacedFrameIndex: -1,
  explanations: []
};

// State for ESC
let escState = {
  currentStep: 0,
  frames: [],
  pointer: 0,
  simulationSteps: [],
  pageFaults: 0,
  hits: 0
};

// Generate a random page-reference string
function generateRefString() {
  console.log('Generating reference string');
  let randomRefString = "";
  for (let i = 0; i < 20; i++) {
    randomRefString += Math.floor(Math.random() * 10) + ", ";
  }
  randomRefString = randomRefString.slice(0, -2);
  if (refStringInput) refStringInput.value = randomRefString;
  fifoLruState.refStringArray = randomRefString.split(',').map(item => item.trim()).filter(item => item !== '');
  resetVisualization();
}

// Validate inputs
function validateInputs() {
  console.log('Validating inputs');
  fifoLruState.validationError = '';
  fifoLruState.refStringArray = refStringInput.value.split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
  
  if (!fifoLruState.refStringArray.every(item => !isNaN(item) && item !== '')) {
    fifoLruState.validationError = 'Reference string must contain only numbers separated by commas.';
    if (explanationDiv && explanationCard) {
      explanationDiv.innerHTML = '<p class="text-red-600">Error: Please enter only numbers separated by commas (like "1, 2, 3")</p>';
      explanationCard.classList.remove('hidden');
      console.log('Showing validation error in explanation');
    }
    return false;
  }
  if (algorithmSelect && algorithmSelect.value === 'none') {
    fifoLruState.validationError = 'Please select an algorithm.';
    if (explanationDiv && explanationCard) {
      explanationDiv.innerHTML = '<p class="text-red-600">Error: Please select an algorithm.</p>';
      explanationCard.classList.remove('hidden');
      console.log('Showing algorithm error in explanation');
    }
    return false;
  }
  const frames = parseInt(numOfFramesInput ? numOfFramesInput.value : 0);
  if (isNaN(frames) || frames < 1 || frames > 10) {
    fifoLruState.validationError = 'Number of frames must be between 1 and 10.';
    if (explanationDiv && explanationCard) {
      explanationDiv.innerHTML = '<p class="text-red-600">Error: Please choose between 1 and 10 frames</p>';
      explanationCard.classList.remove('hidden');
      console.log('Showing frame count error in explanation');
    }
    return false;
  }
  fifoLruState.frames = frames;
  return true;
}

// Reset visualization
function resetVisualization() {
  console.log('Resetting visualization');
  fifoLruState.currentIndex = 0;
  fifoLruState.pageFaults = 0;
  fifoLruState.pageHits = 0;
  fifoLruState.prevPageFrame = new Array(fifoLruState.frames).fill().map(() => ["-", "-"]);
  fifoLruState.currentPageFrame = new Array(fifoLruState.frames).fill().map(() => ["-", "-"]);
  fifoLruState.replacedFrameIndex = -1;
  fifoLruState.isRunning = false;
  fifoLruState.explanations = [];

  escState.currentStep = 0;
  escState.frames = [];
  escState.pointer = 0;
  escState.simulationSteps = [];
  escState.pageFaults = 0;
  escState.hits = 0;

  if (output) output.innerHTML = "";
  if (summary) summary.innerHTML = "";
  if (explanationDiv && explanationCard) {
    explanationDiv.innerHTML = `
      <div class="bg-blue-50 p-4 rounded-md">
        <h3 class="text-lg font-semibold text-blue-600">How to Use</h3>
        <p class="text-gray-700">Select an algorithm, set the number of frames, and enter a page reference string. Click "Next Step" for step-by-step execution with explanations, or "Run All" for the full simulation.</p>
      </div>
    `;
    explanationCard.classList.add('hidden');
    console.log('Explanation card hidden on reset');
  }
  if (errorMessage) errorMessage.innerHTML = "";
  if (nextStepBtn) nextStepBtn.classList.remove('show');
  updateUI();
}

// Update UI elements
function updateUI() {
  const isValid = validateInputs();
  console.log('Updating UI, isValid:', isValid, 'ESC step:', escState.currentStep, 'Steps length:', escState.simulationSteps.length);

  if (isValid && algorithmSelect.value === 'ESC' && escState.currentStep === 0 && escState.simulationSteps.length === 0) {
    console.log('Calling initSimulation from updateUI');
    initSimulation();
  }

  if (stepBtn) {
    stepBtn.disabled = !isValid || 
      (algorithmSelect.value !== 'ESC' 
        ? fifoLruState.currentIndex >= fifoLruState.refStringArray.length 
        : escState.currentStep >= escState.simulationSteps.length);
    console.log('Step button disabled:', stepBtn.disabled);
  }
  if (nextStepBtn) {
    nextStepBtn.disabled = !isValid || 
      (algorithmSelect.value !== 'ESC' 
        ? fifoLruState.currentIndex >= fifoLruState.refStringArray.length 
        : escState.currentStep >= escState.simulationSteps.length);
  }
  if (runAllBtn) {
    runAllBtn.disabled = !isValid;
    console.log('Run All button disabled:', runAllBtn.disabled);
  }
  if (resetBtn) {
    resetBtn.disabled = !fifoLruState.isRunning && escState.currentStep === 0;
  }

  if (errorMessage) {
    errorMessage.innerHTML = fifoLruState.validationError ? `<div class="text-red-600">${fifoLruState.validationError}</div>` : '';
  }

  if (timeline) {
    timeline.innerHTML = fifoLruState.refStringArray.map((val, idx) => {
      let btnClass = '';
      const currentIndex = algorithmSelect.value !== 'ESC' ? fifoLruState.currentIndex : escState.currentStep;
      if (idx === currentIndex || (!fifoLruState.isRunning && idx === 0)) {
        btnClass = 'bg-blue-600 text-white hover:bg-blue-700';
      } else if (idx < currentIndex) {
        btnClass = 'bg-gray-200 text-gray-800 hover:bg-gray-300';
      } else {
        btnClass = 'bg-gray-500 text-white cursor-not-allowed';
      }
      return `
        <button class="px-2 py-1 text-sm font-medium rounded-md ${btnClass} transition-colors" 
                onclick="jumpToStep(${idx})" 
                ${idx >= currentIndex ? 'disabled aria-disabled="true"' : `aria-label="Jump to step ${idx}"`}>
          ${val}
        </button>
      `;
    }).join('');
  }

  renderSummary();
}

// Jump to a specific step
function jumpToStep(index) {
  console.log('Jumping to step:', index);
  if (index >= fifoLruState.refStringArray.length || index < 0) return;
  resetVisualization();
  fifoLruState.isRunning = true;
  for (let i = 0; i <= index; i++) {
    if (algorithmSelect.value !== 'ESC') {
      fifoLruState.currentIndex = i;
      processFifoLruStep(true);
    } else {
      escState.currentStep = i;
      if (escState.currentStep === 0) initSimulation();
      renderStep(true);
    }
  }
  updateUI();
}

// Process one step for FIFO/LRU
function processFifoLruStep(showExplanation = false) {
  console.log('Processing FIFO/LRU step:', fifoLruState.currentIndex);
  if (fifoLruState.currentIndex >= fifoLruState.refStringArray.length) return;

  const i = fifoLruState.currentIndex;
  let isPageFault = false;
  const algorithm = algorithmSelect.value;
  fifoLruState.replacedFrameIndex = -1;
  let explanation = [`<h3 class="text-lg font-semibold">${algorithm} Step ${i + 1}: Page ${fifoLruState.refStringArray[i]}</h3>`];

  let isFull = fifoLruState.prevPageFrame.every(item => item[0] !== "-");
  if (algorithm === 'FIFO') {
    fifoLruState.prevPageFrame = fifoLruState.currentPageFrame.slice();
    let indexOfRef = fifoLruState.prevPageFrame.findIndex(item => item[0] === fifoLruState.refStringArray[i]);
    if (indexOfRef === -1) { // Page Fault
      fifoLruState.pageFaults++;
      isPageFault = true;
      if (!isFull) {
        fifoLruState.replacedFrameIndex = fifoLruState.prevPageFrame.findIndex(item => item[0] === "-");
        fifoLruState.prevPageFrame[fifoLruState.replacedFrameIndex] = [fifoLruState.refStringArray[i], i];
        explanation.push(`<p class="text-red-600">Page Fault: Page ${fifoLruState.refStringArray[i]} not in memory.</p>`);
        explanation.push(`<p>Loaded page ${fifoLruState.refStringArray[i]} into empty frame ${fifoLruState.replacedFrameIndex}.</p>`);
      } else {
        fifoLruState.replacedFrameIndex = fifoLruState.prevPageFrame.reduce((minIdx, item, idx) => 
          item[1] < fifoLruState.prevPageFrame[minIdx][1] ? idx : minIdx, 0);
        explanation.push(`<p class="text-red-600">Page Fault: Page ${fifoLruState.refStringArray[i]} not in memory.</p>`);
        explanation.push(`<p>Replaced oldest page ${fifoLruState.prevPageFrame[fifoLruState.replacedFrameIndex][0]} in frame ${fifoLruState.replacedFrameIndex} with page ${fifoLruState.refStringArray[i]}.</p>`);
        fifoLruState.prevPageFrame[fifoLruState.replacedFrameIndex] = [fifoLruState.refStringArray[i], i];
      }
    } else {
      fifoLruState.pageHits++;
      explanation.push(`<p class="text-green-600">Hit: Page ${fifoLruState.refStringArray[i]} already in frame ${indexOfRef}.</p>`);
    }
    fifoLruState.currentPageFrame = fifoLruState.prevPageFrame.slice();
  } else if (algorithm === 'LRU') {
    fifoLruState.prevPageFrame = fifoLruState.currentPageFrame.slice();
    let indexOfRef = fifoLruState.prevPageFrame.findIndex(item => item[0] === fifoLruState.refStringArray[i]);
    if (indexOfRef === -1) { // Page Fault
      fifoLruState.pageFaults++;
      isPageFault = true;
      if (!isFull) {
        fifoLruState.replacedFrameIndex = fifoLruState.prevPageFrame.findIndex(item => item[0] === "-");
        fifoLruState.prevPageFrame[fifoLruState.replacedFrameIndex] = [fifoLruState.refStringArray[i], i];
        explanation.push(`<p class="text-red-600">Page Fault: Page ${fifoLruState.refStringArray[i]} not in memory.</p>`);
        explanation.push(`<p>Loaded page ${fifoLruState.refStringArray[i]} into empty frame ${fifoLruState.replacedFrameIndex}.</p>`);
      } else {
        fifoLruState.replacedFrameIndex = fifoLruState.prevPageFrame.reduce((minIdx, item, idx) => 
          item[1] < fifoLruState.prevPageFrame[minIdx][1] ? idx : minIdx, 0);
        explanation.push(`<p class="text-red-600">Page Fault: Page ${fifoLruState.refStringArray[i]} not in memory.</p>`);
        explanation.push(`<p>Replaced least recently used page ${fifoLruState.prevPageFrame[fifoLruState.replacedFrameIndex][0]} in frame ${fifoLruState.replacedFrameIndex} with page ${fifoLruState.refStringArray[i]}.</p>`);
        fifoLruState.prevPageFrame[fifoLruState.replacedFrameIndex] = [fifoLruState.refStringArray[i], i];
      }
    } else { // Page Hit
      fifoLruState.pageHits++;
      fifoLruState.prevPageFrame[indexOfRef][1] = i;
      explanation.push(`<p class="text-green-600">Hit: Page ${fifoLruState.refStringArray[i]} already in frame ${indexOfRef}.</p>`);
      explanation.push(`<p>Updated recency for page ${fifoLruState.refStringArray[i]}.</p>`);
    }
    fifoLruState.currentPageFrame = fifoLruState.prevPageFrame.slice();
  }

  // Render output
  let pageFrame = "";
  let borderClass = algorithm === 'FIFO' ? 'border-teal-500' : 'border-indigo-500';
  let statusClass = isPageFault ? 'miss' : 'hit';
  for (let k = 0; k < fifoLruState.frames; k++) {
    let data = fifoLruState.currentPageFrame[k][0];
    let cellClass = k === fifoLruState.replacedFrameIndex ? 'replaced animate-pop-in' : '';
    
    pageFrame += `
      <div class="border ${borderClass} text-center w-10 h-10 flex items-center justify-center rounded-md ${cellClass}"
           title="Page ${data}" aria-label="Page ${data}">
        ${data}
      </div>`;
  }
  if (output) {
    output.innerHTML += `
      <div class="flex flex-col items-center p-2">
        <div class="font-semibold text-gray-900">${fifoLruState.refStringArray[i]}</div>
        <div class="flex flex-col gap-1 ${statusClass} rounded-md p-1">${pageFrame}</div>
        <div class="text-xs ${isPageFault ? 'text-red-600' : 'text-green-600'}">${isPageFault ? 'Miss' : 'Hit'}</div>
      </div>
    `;
  }

  // Save explanation
  fifoLruState.explanations.push(explanation);

  // Show explanation if requested, but don't scroll to it
  if (showExplanation && explanationDiv && explanationCard) {
    explanationDiv.innerHTML = explanation.join('');
    explanationCard.classList.remove('hidden');
  }

  // Scroll output into view (ensured as final scroll action)
  if (output) {
    console.log('Scrolling to output section for FIFO/LRU step', fifoLruState.currentIndex);
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (nextStepBtn) nextStepBtn.classList.add('show');

  fifoLruState.currentIndex++;
  fifoLruState.isRunning = true;

  renderSummary();
  updateUI();
}

// ESC Logic
function initSimulation() {
  console.log('Initializing ESC simulation');
  const refString = refStringInput.value.split(',').map(item => {
    const trimmed = item.trim();
    const num = parseInt(trimmed);
    return isNaN(num) ? null : num;
  }).filter(item => item !== null);
  const frameCount = parseInt(numOfFramesInput.value);
  
  if (refString.length === 0 || refString.some(item => item === null)) {
    console.log('Validation failed: Invalid reference string');
    if (explanationDiv && explanationCard) {
      explanationDiv.innerHTML = '<p class="text-red-600">Error: Please enter only numbers separated by commas (like "1, 2, 3")</p>';
      explanationCard.classList.remove('hidden');
      console.log('Showing validation error in explanation');
    }
    return false;
  }
  
  if (isNaN(frameCount) || frameCount < 1 || frameCount > 10) {
    console.log('Validation failed: Invalid frame count');
    if (explanationDiv && explanationCard) {
      explanationDiv.innerHTML = '<p class="text-red-600">Error: Please choose between 1 and 10 frames</p>';
      explanationCard.classList.remove('hidden');
      console.log('Showing frame count error in explanation');
    }
    return false;
  }
  
  escState.frames = Array(frameCount).fill(null).map(() => ({ page: null, ref: 0, mod: 0 }));
  escState.pointer = 0;
  escState.currentStep = 0;
  escState.simulationSteps = [];
  escState.pageFaults = 0;
  escState.hits = 0;
  output.innerHTML = '';
  
  console.log('Reference String:', refString);
  
  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    let isHit = false;
    let replacedFrame = null;
    let replacementProcess = [];
    let detailedExplanation = [];
    
    console.log(`Processing step ${i + 1}, page ${page}`);
    
    const existingFrameIndex = escState.frames.findIndex(f => f.page === page);
    
    if (existingFrameIndex !== -1) {
      escState.frames[existingFrameIndex].ref = 1;
      isHit = true;
      escState.hits++;
      replacementProcess.push(`Found page ${page} in memory`);
      detailedExplanation.push(`<h3 class="text-lg font-semibold">ESC Step ${i + 1}: Page ${page}</h3>`);
      detailedExplanation.push(`<p class="text-green-600">Hit: Found page ${page} already in frame ${existingFrameIndex}.</p>`);
      detailedExplanation.push(`<p>Set reference bit to 1 (marked as recently used).</p>`);
      detailedExplanation.push(`<p>Modification bit remains M=${escState.frames[existingFrameIndex].mod} (unchanged).</p>`);
    } else {
      escState.pageFaults++;
      let replacementIndex = null;
      
      detailedExplanation.push(`<h3 class="text-lg font-semibold">ESC Step ${i + 1}: Page ${page}</h3>`);
      detailedExplanation.push(`<p class="text-red-600">Page Fault: Page ${page} not found in memory.</p>`);
      detailedExplanation.push(`<p>Need to load page ${page} by replacing another page.</p>`);
      detailedExplanation.push(`<p>Starting at frame ${escState.pointer} (pointer position).</p>`);
      
      detailedExplanation.push(`<p class="font-medium">First Pass: Looking for (R=0, M=0)</p>`);
      for (let j = 0; j < escState.frames.length; j++) {
        const frameIndex = (escState.pointer + j) % escState.frames.length;
        const frame = escState.frames[frameIndex];
        
        if (frame.page === null) {
          replacementIndex = frameIndex;
          escState.pointer = (frameIndex + 1) % escState.frames.length;
          replacementProcess.push(`Found empty frame ${frameIndex}`);
          detailedExplanation.push(`<p>Found empty frame ${frameIndex} - loading page ${page}.</p>`);
          detailedExplanation.push(`<p>Pointer moves to frame ${escState.pointer}.</p>`);
          break;
        }
        
        if (frame.ref === 0 && frame.mod === 0) {
          replacementIndex = frameIndex;
          escState.pointer = (frameIndex + 1) % escState.frames.length;
          replacementProcess.push(`Selected frame ${frameIndex} (R=0, M=0)`);
          detailedExplanation.push(`<p>Found page ${frame.page} with R=0, M=0 - best candidate.</p>`);
          detailedExplanation.push(`<p>Will replace with page ${page}.</p>`);
          detailedExplanation.push(`<p>Pointer moves to frame ${escState.pointer}.</p>`);
          break;
        }
      }
      
      if (replacementIndex === null) {
        detailedExplanation.push(`<p class="font-medium">Second Pass: No (R=0, M=0), looking for (R=0, M=1)</p>`);
        for (let j = 0; j < escState.frames.length; j++) {
          const frameIndex = (escState.pointer + j) % escState.frames.length;
          const frame = escState.frames[frameIndex];
          
          if (frame.ref === 0 && frame.mod === 1) {
            replacementIndex = frameIndex;
            escState.pointer = (frameIndex + 1) % escState.frames.length;
            replacementProcess.push(`Selected frame ${frameIndex} (R=0, M=1)`);
            detailedExplanation.push(`<p>Found page ${frame.page} with R=0, M=1 - good candidate.</p>`);
            detailedExplanation.push(`<p>Will replace with page ${page}.</p>`);
            detailedExplanation.push(`<p>Pointer moves to frame ${escState.pointer}.</p>`);
            break;
          }
        }
      }
      
      if (replacementIndex === null) {
        detailedExplanation.push(`<p class="font-medium">Third Pass: No candidates, resetting R bits</p>`);
        for (let j = 0; j < escState.frames.length; j++) {
          escState.frames[j].ref = 0;
          replacementProcess.push(`Reset R bit for frame ${j}`);
          detailedExplanation.push(`<p>Reset R bit for frame ${j} to 0.</p>`);
        }
        
        for (let j = 0; j < escState.frames.length; j++) {
          const frameIndex = (escState.pointer + j) % escState.frames.length;
          const frame = escState.frames[frameIndex];
          
          if (frame.ref === 0 && frame.mod === 0) {
            replacementIndex = frameIndex;
            escState.pointer = (frameIndex + 1) % escState.frames.length;
            replacementProcess.push(`Selected frame ${frameIndex} (R=0, M=0)`);
            detailedExplanation.push(`<p>Found page ${frame.page} with R=0, M=0 after reset.</p>`);
            detailedExplanation.push(`<p>Will replace with page ${page}.</p>`);
            detailedExplanation.push(`<p>Pointer moves to frame ${escState.pointer}.</p>`);
            break;
          }
        }
        
        if (replacementIndex === null) {
          for (let j = 0; j < escState.frames.length; j++) {
            const frameIndex = (escState.pointer + j) % escState.frames.length;
            const frame = escState.frames[frameIndex];
            
            if (frame.ref === 0 && frame.mod === 1) {
              replacementIndex = frameIndex;
              escState.pointer = (frameIndex + 1) % escState.frames.length;
              replacementProcess.push(`Selected frame ${frameIndex} (R=0, M=1)`);
              detailedExplanation.push(`<p>Found page ${frame.page} with R=0, M=1 after reset.</p>`);
              detailedExplanation.push(`<p>Will replace with page ${page}.</p>`);
              detailedExplanation.push(`<p>Pointer moves to frame ${escState.pointer}.</p>`);
              break;
            }
          }
        }
      }
      
      if (replacementIndex === null) {
        replacementIndex = escState.pointer;
        escState.pointer = (escState.pointer + 1) % escState.frames.length;
        replacementProcess.push(`Fallback - using frame ${replacementIndex}`);
        detailedExplanation.push(`<p>No candidates found - using frame ${replacementIndex}.</p>`);
      }
      
      replacedFrame = replacementIndex;
      const replacedPage = escState.frames[replacementIndex].page;
      const isModified = page % 2 === 1;
      console.log(`Step ${i + 1}: Page ${page}, M=${isModified ? 1 : 0} (odd=${page % 2 === 1})`);
      escState.frames[replacementIndex].mod = isModified ? 1 : 0;
      escState.frames[replacementIndex].page = page;
      escState.frames[replacementIndex].ref = 1;
      
      replacementProcess.push(`Replaced frame ${replacementIndex} (${replacedPage || 'empty'}) with page ${page}`);
      detailedExplanation.push(`<p>Replaced ${replacedPage || 'empty'} in frame ${replacementIndex} with page ${page}.</p>`);
      detailedExplanation.push(`<p>Set reference bit to 1.</p>`);
      detailedExplanation.push(`<p>Set modification bit to ${isModified ? '1 (odd page)' : '0 (even page)'}</p>`);
      
      console.log(`After step ${i + 1}, frames:`, JSON.stringify(escState.frames));
    }
    
    escState.simulationSteps.push({
      step: i + 1,
      reference: page,
      frames: JSON.parse(JSON.stringify(escState.frames)),
      isHit,
      replacedFrame,
      pointer: escState.pointer,
      replacementProcess,
      detailedExplanation
    });
  }
  
  console.log('ESC simulation initialized, steps:', escState.simulationSteps.length);
  return true;
}

function renderStep(showExplanation = true) {
  console.log('Rendering ESC step:', escState.currentStep);
  if (escState.currentStep >= escState.simulationSteps.length) {
    if (explanationDiv && explanationCard) {
      explanationDiv.innerHTML = '<p class="text-green-600">Simulation complete! See summary below.</p>';
      explanationCard.classList.remove('hidden');
    }
    if (nextStepBtn) nextStepBtn.classList.remove('show');
    renderSummary();
    return;
  }
  
  const step = escState.simulationSteps[escState.currentStep];
  
  const table = document.createElement('table');
  table.className = 'border-collapse mb-4 w-full border-l-4 border-amber-500 bg-gray-50 rounded-md p-2';
  
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.className = 'bg-amber-100 text-amber-800 p-2 text-left';
  headerCell.textContent = `Step ${step.step}: Page ${step.reference}`;
  headerCell.colSpan = escState.frames.length + 1;
  headerRow.appendChild(headerCell);
  table.appendChild(headerRow);
  
  const framesRow = document.createElement('tr');
  const memoryLabel = document.createElement('td');
  memoryLabel.className = 'p-2 text-gray-700';
  memoryLabel.textContent = 'Memory:';
  framesRow.appendChild(memoryLabel);
  
  for (let i = 0; i < escState.frames.length; i++) {
    const frame = step.frames[i];
    const cell = document.createElement('td');
    cell.className = 'page-cell';
    
    if (i === step.pointer) {
      cell.classList.add('pointer');
      cell.title = "Current pointer position";
    }
    
    if (frame.page !== null) {
      cell.textContent = frame.page;
      const refBit = document.createElement('span');
      refBit.className = 'ref-bit';
      refBit.textContent = `R=${frame.ref}, M=${frame.mod}`;
      refBit.title = `Reference bit (1=recently used), Modification bit (1=odd page, 0=even page)`;
      cell.appendChild(refBit);
      
      if (step.replacedFrame === i) {
        cell.classList.add('replaced', 'animate-pop-in');
        cell.style.fontWeight = 'bold';
        cell.title = "This page was just added/replaced";
      }
      console.log(`Rendering frame ${i}: page=${frame.page}, R=${frame.ref}, M=${frame.mod}`);
    } else {
      cell.textContent = '-';
      cell.title = "Empty frame";
      const refBit = document.createElement('span');
      refBit.className = 'ref-bit';
      refBit.textContent = `R=0, M=0`;
      refBit.title = "Empty frame (no page loaded)";
      cell.appendChild(refBit);
    }
    
    framesRow.appendChild(cell);
  }
  table.appendChild(framesRow);
  
  const statusRow = document.createElement('tr');
  const statusLabel = document.createElement('td');
  statusLabel.className = 'p-2 text-gray-700';
  statusLabel.textContent = 'Result:';
  statusRow.appendChild(statusLabel);
  const statusCell = document.createElement('td');
  statusCell.colSpan = escState.frames.length;
  statusCell.className = step.isHit ? 'bg-green-200 text-green-800 p-2' : 'bg-red-200 text-red-800 p-2';
  statusCell.textContent = step.isHit ? 'Hit (page in memory)' : 'Miss (page fault)';
  statusRow.appendChild(statusCell);
  table.appendChild(statusRow);
  
  if (output) output.appendChild(table);
  
  // Show explanation if requested, but don't scroll to it
  if (showExplanation && explanationDiv && explanationCard) {
    explanationDiv.innerHTML = step.detailedExplanation.join('');
    explanationCard.classList.remove('hidden');
  }
  
  // Scroll output into view (ensured as final scroll action)
  if (output) {
    console.log('Scrolling to output section for ESC step', escState.currentStep);
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (nextStepBtn) nextStepBtn.classList.add('show');

  renderSummary();
  escState.currentStep++;
  updateUI();
}

// Run all steps for FIFO/LRU
function visualizeFifoLru() {
  console.log('Visualizing FIFO/LRU');
  resetVisualization();
  fifoLruState.isRunning = true;
  for (let i = 0; i < fifoLruState.refStringArray.length; i++) {
    fifoLruState.currentIndex = i;
    processFifoLruStep(false);
  }
  updateUI();
}

// Run all steps for ESC
function visualizeEsc() {
  console.log('Visualizing ESC');
  if (!initSimulation()) return;
  
  runAllBtn.disabled = true;
  stepBtn.disabled = true;
  if (nextStepBtn) nextStepBtn.disabled = true;

  if (explanationDiv && explanationCard) {
    explanationDiv.innerHTML = '';
    explanationCard.classList.add('hidden');
  }

  function runNextStep() {
    if (escState.currentStep >= escState.simulationSteps.length) {
      runAllBtn.disabled = false;
      stepBtn.disabled = false;
      if (nextStepBtn) nextStepBtn.disabled = false;
      if (nextStepBtn) nextStepBtn.classList.remove('show');
      renderSummary();
      return;
    }
    
    renderStep(false);
    
    if (escState.currentStep < escState.simulationSteps.length) {
      setTimeout(runNextStep, 500);
    } else {
      runAllBtn.disabled = false;
      stepBtn.disabled = false;
      if (nextStepBtn) nextStepBtn.disabled = false;
      if (nextStepBtn) nextStepBtn.classList.remove('show');
      renderSummary();
    }
  }
  
  runNextStep();
}

// Render summary
function renderSummary() {
  console.log('Rendering summary');
  if (!summary) return;
  const faults = algorithmSelect.value !== 'ESC' ? fifoLruState.pageFaults : escState.pageFaults;
  const hits = algorithmSelect.value !== 'ESC' ? fifoLruState.pageHits : escState.hits;
  const total = faults + hits;
  const hitRatio = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;

  summary.innerHTML = `
    <div class="bg-blue-50 p-4 rounded-md shadow-sm animate-fade-in">
      <div class="flex items-center mb-2">
        
        <div>
          <div class="text-sm text-gray-600">Total Faults</div>
          <div class="text-xl font-bold text-gray-900">${faults}</div>
        </div>
      </div>
    </div>
    <div class="bg-blue-50 p-4 rounded-md shadow-sm animate-fade-in">
      <div class="flex items-center mb-2">
        
        <div>
          <div class="text-sm text-gray-600">Total Hits</div>
          <div class="text-xl font-bold text-gray-900">${hits}</div>
        </div>
      </div>
    </div>
    <div class="bg-blue-50 p-4 rounded-md shadow-sm animate-fade-in">
      <div class="flex items-center mb-2">
        
        <div>
          <div class="text-sm text-gray-600">Hit Ratio</div>
          <div class="text-xl font-bold text-gray-900">${hitRatio}%</div>
        </div>
      </div>
    </div>
  `;
}

// Event Listeners
if (genRefBtn) {
  genRefBtn.addEventListener('click', generateRefString);
}
if (algorithmSelect) {
  algorithmSelect.addEventListener('change', resetVisualization);
}
if (numOfFramesInput) {
  numOfFramesInput.addEventListener('input', resetVisualization);
}
if (refStringInput) {
  refStringInput.addEventListener('input', resetVisualization);
}
if (stepBtn) {
  stepBtn.addEventListener('click', () => {
    console.log('Step button clicked, algorithm:', algorithmSelect.value);
    if (algorithmSelect.value !== 'ESC') {
      if (!fifoLruState.isRunning) {
        resetVisualization();
      }
      processFifoLruStep(true);
    } else {
      if (escState.currentStep === 0 && !initSimulation()) return;
      renderStep(true);
    }
  });
}
if (nextStepBtn) {
  nextStepBtn.addEventListener('click', () => {
    console.log('Next Step button clicked, algorithm:', algorithmSelect.value);
    if (algorithmSelect.value !== 'ESC') {
      processFifoLruStep(true);
    } else {
      renderStep(true);
    }
  });
}
if (runAllBtn) {
  runAllBtn.addEventListener('click', () => {
    console.log('Run All button clicked, algorithm:', algorithmSelect.value);
    if (algorithmSelect.value !== 'ESC') {
      visualizeFifoLru();
    } else {
      visualizeEsc();
    }
  });
}
if (resetBtn) {
  resetBtn.addEventListener('click', resetVisualization);
}
if (toggleExplanation) {
  toggleExplanation.addEventListener('click', () => {
    if (explanationCard.classList.contains('hidden')) {
      explanationCard.classList.remove('hidden');
      toggleExplanation.textContent = 'Hide';
      if (explanationDiv) {
        console.log('Scrolling to explanation card on toggle');
        explanationDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      explanationCard.classList.add('hidden');
      toggleExplanation.textContent = 'Show';
    }
  });
}

// Make jumpToStep globally available
window.jumpToStep = jumpToStep;

// Initialize UI
console.log('Initializing UI');
updateUI();