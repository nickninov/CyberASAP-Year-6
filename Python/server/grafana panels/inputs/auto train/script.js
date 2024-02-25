// Fetched from
// https://24ways.org/2019/making-a-better-custom-select-element/
// https://codepen.io/stringyland/pen/xxGyBEE/a7106a2577dbc246875275a7c8182abf

// SETUP
// /////////////////////////////////
// assign names to things we'll need to use more than once
const csSelector = document.querySelector('#myCustomSelect'); // the input, svg and ul as a group
const csStatus = document.querySelector('#custom-select-status');

// EVENTS

// FUNCTIONS
// /////////////////////////////////

function addDropdown(text, ul){

	var li = document.createElement("li");

	li.classList.add("dropdown_tag")
	li.setAttribute("role", "option");
	li.setAttribute("tabindex", "-1");
	
	var span = document.createElement("span");

	span.innerHTML = text

	li.appendChild(span);
	ul.appendChild(li)
}



function findFocus() {
	const focusPoint = document.activeElement;
	return focusPoint;
}

function moveFocus(fromHere, toThere) {
	// grab the currently showing options, which might have been filtered
	const aCurrentOptions = aOptions.filter(function (option) {
		if (option.style.display === '') {
			return true;
		}
	});
	// don't move if all options have been filtered out
	if (aCurrentOptions.length === 0) {
		return;
	}
	if (toThere === 'input') {
		csInput.focus();
	}
	// possible start points
	switch (fromHere) {
		case csInput:
			if (toThere === 'forward') {
				aCurrentOptions[0].focus();
			} else if (toThere === 'back') {
				aCurrentOptions[aCurrentOptions.length - 1].focus();
			}
			break;
		case csOptions[0]:
			if (toThere === 'forward') {
				aCurrentOptions[1].focus();
			} else if (toThere === 'back') {
				csInput.focus();
			}
			break;
		case csOptions[csOptions.length - 1]:
			if (toThere === 'forward') {
				aCurrentOptions[0].focus();
			} else if (toThere === 'back') {
				aCurrentOptions[aCurrentOptions.length - 2].focus();
			}
			break;
		default: // middle list or filtered items
			const currentItem = findFocus();
			const whichOne = aCurrentOptions.indexOf(currentItem);
			if (toThere === 'forward') {
				const nextOne = aCurrentOptions[whichOne + 1];
				nextOne.focus();
			} else if (toThere === 'back' && whichOne > 0) {
				const previousOne = aCurrentOptions[whichOne - 1];
				previousOne.focus();
			} else {
				// if whichOne = 0
				csInput.focus();
			}
			break;
	}
}

function doFilter() {
	const terms = csInput.value;
	const aFilteredOptions = aOptions.filter(function (option) {
		if (option.innerText.toUpperCase().startsWith(terms.toUpperCase())) {
			return true;
		}
	});
	csOptions.forEach((option) => (option.style.display = 'none'));
	aFilteredOptions.forEach(function (option) {
		option.style.display = '';
	});
	setState('filtered');
	updateStatus(aFilteredOptions.length);
}

function updateStatus(howMany) {
	csStatus.textContent = howMany + ' options available.';
}

function makeChoice(whichOption) {
	csInput.classList.add('filled');
	const optionTitle = whichOption.querySelector('span');
	csInput.value = optionTitle.textContent;
	moveFocus(document.activeElement, 'input');
	// update aria-selected, if using
}

function setState(newState) {
	switch (newState) {
		case 'initial':
			csState = 'initial';
			break;
		case 'opened':
			csState = 'opened';
			break;
		case 'filtered':
			csState = 'filtered';
			break;
		case 'closed':
			csState = 'closed';
	}
}

function doKeyAction(whichKey) {
	const currentFocus = findFocus();
	
	switch (whichKey) {
		case 'Enter':
			if (csState === 'initial') {
				// if state = initial, toggleOpen and set state to opened
				toggleList('Open');
				setState('opened');
			} else if (csState === 'opened' && currentFocus.tagName === 'LI') {
				// if state = opened and focus on list, makeChoice and set state to closed
				makeChoice(currentFocus);
				toggleList('Shut');
				setState('closed');
			} else if (csState === 'opened' && currentFocus === csInput) {
				// if state = opened and focus on input, close it
				toggleList('Shut');
				setState('closed');
			} else if (
				csState === 'filtered' &&
				currentFocus.tagName === 'LI'
			) {
				// if state = filtered and focus on list, makeChoice and set state to closed
				makeChoice(currentFocus);
				toggleList('Shut');
				setState('closed');
			} else if (csState === 'filtered' && currentFocus === csInput) {
				// if state = filtered and focus on input, set state to opened
				toggleList('Open');
				setState('opened');
			} else {
				// i.e. csState is closed, or csState is opened/filtered but other focus point?
				// if state = closed, set state to filtered? i.e. open but keep existing input?
				toggleList('Open');
				setState('filtered');
			}
			break;

		case 'Escape':
			// if state = initial, do nothing
			// if state = opened or filtered, set state to initial
			// if state = closed, do nothing
			if (csState === 'opened' || csState === 'filtered') {
				toggleList('Shut');
				setState('initial');
			}
			break;

		case 'ArrowDown':
			if (csState === 'initial' || csState === 'closed') {
				// if state = initial or closed, set state to opened and moveFocus to first
				toggleList('Open');
				moveFocus(csInput, 'forward');
				setState('opened');
			} else {
				// if state = opened and focus on input, moveFocus to first
				// if state = opened and focus on list, moveFocus to next/first
				// if state = filtered and focus on input, moveFocus to first
				// if state = filtered and focus on list, moveFocus to next/first
				toggleList('Open');
				moveFocus(currentFocus, 'forward');
			}
			break;
		case 'ArrowUp':
			if (csState === 'initial' || csState === 'closed') {
				// if state = initial, set state to opened and moveFocus to last
				// if state = closed, set state to opened and moveFocus to last
				toggleList('Open');
				moveFocus(csInput, 'back');
				setState('opened');
			} else {
				// if state = opened and focus on input, moveFocus to last
				// if state = opened and focus on list, moveFocus to prev/last
				// if state = filtered and focus on input, moveFocus to last
				// if state = filtered and focus on list, moveFocus to prev/last
				moveFocus(currentFocus, 'back');
			}
			break;
		default:
			if (csState === 'initial') {
				// if state = initial, toggle open, doFilter and set state to filtered
				toggleList('Open');
				doFilter();
				setState('filtered');
			} else if (csState === 'opened') {
				// if state = opened, doFilter and set state to filtered
				doFilter();
				setState('filtered');
			} else if (csState === 'closed') {
				// if state = closed, doFilter and set state to filtered
				doFilter();
				setState('filtered');
			} else {
				// already filtered
				doFilter();
			}
			break;
	}
}

(function () {
	this.tagsInput = function () {
		// Default state
		var defaults = {
			selector: '',
			max: null,
			duplicate: false,
			wrapperClass: 'tags-input-wrapper',
			tagClass: 'tag',
		};

		// Initialize elements
		this.arr = [];
		this.input = document.createElement('input');
		this.wrapper = document.createElement('div');
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = Object.assign(defaults, arguments[0]);
		}
		this.original_input = document.getElementById(this.options.selector);

		buildUI.call(this);
		addEvents.call(this);

		// Building UI Elements
		function buildUI() {
			this.wrapper.append(this.input);
			this.wrapper.classList.add(this.options.wrapperClass);
			this.original_input.setAttribute('hidden', 'true');
			this.original_input.parentNode.insertBefore(
				this.wrapper,
				this.original_input
			);
		}

		// Initialize Events
		function addEvents() {
			var _ = this;
			this.wrapper.addEventListener('click', function () {
				_.input.focus();
			});

			this.input.addEventListener('keydown', function (event) {
				var str = _.input.value.trim();
				if (!!~[9, 13, 188].indexOf(event.keyCode)) {
					_.input.value = '';
					if (str != '') {
						_.addTag(str);
					}
				}
			});
		}

		// Add Tag
		tagsInput.prototype.addTag = function (string) {
			if (this.anyErrors(string)) return;

			this.arr.push(string);
			var tagInput = this;

			var tag = document.createElement('span');
			tag.className = this.options.tagClass;
			tag.textContent = string;

			var closeIcon = document.createElement('div');
			closeIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
  				<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
			</svg>`;
			closeIcon.addEventListener('click', function (event) {
				event.preventDefault();
				var tag = this.parentNode;

				for (var i = 0; i < tagInput.wrapper.childNodes.length; i++) {
					if (tagInput.wrapper.childNodes[i] == tag)
						tagInput.deleteTag(tag, i);
				}
			});

			tag.appendChild(closeIcon);
			this.wrapper.insertBefore(tag, this.input);

			this.original_input.value = this.arr.join(',');
			return this;
		};

		// Delete Tag
		tagsInput.prototype.deleteTag = function (tag, i) {
			tag.remove();
			this.arr.splice(i, 1);
			this.original_input.value = this.arr.join(',');
			return this;
		};

		// Errors
		tagsInput.prototype.anyErrors = function (string) {
			if (
				this.options.max != null &&
				this.arr.length >= this.options.max
			) {
				console.log('Max tags limit reached');
				return true;
			}

			if (!this.options.duplicate && this.arr.indexOf(string) != -1) {
				console.log('duplicate found " ' + string + ' " ');
				return true;
			}

			return false;
		};

		tagsInput.prototype.addData = function (array) {
			var plugin = this;

			array.forEach(function (string) {
				plugin.addTag(string);
			});
			return this;
		};
	};
})();

// Range Input
const rangeInputs = document.querySelectorAll('input[type="range"]');

const batch_size = document.querySelectorAll('.batch_size')[0];
const epochs = document.querySelectorAll('.epochs')[0];

function handleInputChange(e) {
	let target = e.target;
	if (e.target.type !== 'range') {
		target = document.getElementById('range');
	}
	
	// Check if the current range epochs
	if(e['currentTarget'].id == "epochs"){
		epochs.innerHTML = target.value;
	}
	// Check if the current range batch
	else if(e['currentTarget'].id == "batch"){
		batch_size.innerHTML = target.value;
	}

	const min = target.min;
	const max = target.max;
	const val = target.value;

	// console.log(target.value)

	target.style.backgroundSize = ((val - min) * 100) / (max - min) + '% 100%';
}

rangeInputs.forEach((input) => {
	input.addEventListener('input', handleInputChange);
});

// Tabs
const tabTriggers = document.querySelectorAll('.tab-item');
const hightLight = document.querySelector('.high-light');
const activeItem = document.querySelector('.tab-item.active');

function hightLightLink() {
	const tagCords = this.getBoundingClientRect();
	const coords = {
		width: tagCords.width,
		// height: tagCords.height,
		top: (tagCords.top = 0),
		left: tagCords.left + window.screenX,
	};

	hightLight.style.width = `${coords.width}px`;
	// hightLight.style.height = `${coords.height}px`;
	hightLight.style.transform = `translate(${coords.left}px, ${coords.top}px)`;
}

tabTriggers.forEach((tabTrigger) => {
	tabTrigger.addEventListener('click', hightLightLink);
});


const handleClick = (e) => {
	e.preventDefault();
	tabTriggers.forEach((node) => {
		node.classList.remove('active');
	});
	e.currentTarget.classList.add('active');
};

tabTriggers.forEach((node) => {
	node.addEventListener('click', handleClick);
});

// Intermediate checkboxes

const overall = document.querySelector('#selectAll');
const items = document.querySelectorAll('ul.checkbox-ul input');
const textSwap = document.querySelector('#selectALLLabel');

for (const item of items) {
	item.addEventListener('click', updateDisplay);
}

function updateDisplay() {
	let checkedCount = 0;
	for (const item of items) {
		if (item.checked) {
			checkedCount++;
		}
	}

	if (checkedCount === 0) {
		overall.checked = false;
		overall.indeterminate = false;
		overall.parentNode.classList.remove('indeterminate-active');
		textSwap.innerHTML = 'Select Group';
	} else if (checkedCount === items.length) {
		overall.checked = true;
		overall.indeterminate = false;
		overall.parentNode.classList.remove('indeterminate-active');
		textSwap.innerHTML = 'Group Selected';
	} else {
		overall.checked = false;
		overall.indeterminate = true;
		overall.parentNode.classList.add('indeterminate-active');
		textSwap.innerHTML = 'Partial Selection';
	}
}