export default {
	activeToken: '',
	setActiveToken: async (token) => {
		this.activeToken = token;
		await this.getUsageData();
		await this.groupCostsByModel();
	},

	getDate: () => {
		const formatDate = (date) => {
			let year = date.getFullYear();
			let month = (date.getMonth() + 1).toString().padStart(2, '0');
			let day = date.getDate().toString().padStart(2, '0');

			return `${year}-${month}-${day}`;
		};

		const startDate = new Date(dat_startDate.formattedDate);
		const endDate = new Date(dat_endDate.formattedDate);

		return {
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
		};
	},

	validateDates: () => {
		// Parsing the date strings into date objects
		const startDate = new Date(dat_startDate.formattedDate);
		const endDate = new Date(dat_endDate.formattedDate);

		// Checking if the end date is before or the same as the start date
		if (endDate <= startDate) {
			showAlert('The end date should be after the start date.', 'error');
			return false;
		}

		// Checking if the difference between the dates is more than 100 days
		const diffTime = Math.abs(endDate - startDate);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
		if (diffDays > 100) {
			showAlert('The number of days between the start and end date should not be more than 100 days.', 'error');
			return false;
		}

		// If all validations pass
		return true;
	},

	onDateSelected: async () => {
		const datesAreValid = this.validateDates();

		if (datesAreValid) {
			await fetchUsageApi.run();
			return true;
		} else {
			return false
		}
	},

	convertDate: (dateString) => {
		const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const date = new Date(dateString);

		const day = date.getDate().toString().padStart(2, '0');
		const month = monthNames[date.getMonth()];

		return `${day} ${month}`;
	},
	
	getUsageData: async () => {
		if (this.activeToken) {
			return await fetchUsageApi.run()
		} else {
			return mockFetchUsageApi.data;
		}
	},

	groupCostsByModel: async () => {
		const cost = await this.getUsageData()
		const dailyCosts = cost.daily_costs;
		// Create an empty object to hold the result
		let costsByModel = {};

		// Iterate over each day's costs
		dailyCosts.forEach(day => {
			// Convert the timestamp to a date string in 'YYYY-MM-DD' format
			const date = new Date(day.timestamp * 1000);
			let year = date.getFullYear();
			let month = (date.getMonth() + 1).toString().padStart(2, '0');
			let dayString = date.getDate().toString().padStart(2, '0');
			const dateString = `${year}-${month}-${dayString}`;

			// Iterate over each line item in the day's costs
			day.line_items.forEach(item => {
				// If this model hasn't been seen yet, add it to the result object
				if (!costsByModel.hasOwnProperty(item.name)) {
					costsByModel[item.name] = [];
				}

				// Add the cost for this day to this model's costs
				costsByModel[item.name].push({ date: this.convertDate(dateString), cost: item.cost / 1000 });
			});
		});

		return costsByModel;
	},

	findDailyAverageCost: async () => {
		const cost = await this.getUsageData()
		const dailyCosts = cost.daily_costs;
		// Initialize total cost
		let totalCost = 0;

		// Loop over each day's costs
		dailyCosts.forEach(day => {
			// Loop over each line item in the day's costs
			day.line_items.forEach(item => {
				// Add the cost for this item to the total cost
				totalCost += item.cost;
			});
		});

		// Divide total cost by the number of days to get the average
		const averageDailyCost = totalCost / dailyCosts.length;

		return (averageDailyCost / 1000).toFixed(3);
	},
	top10Days: async () => {
		const cost = await this.getUsageData()
		const dailyCosts = cost.daily_costs;
		// Map each day to an object with the date and total cost
		let daysWithTotalCosts = dailyCosts.map(day => {
			// Convert the timestamp to a date string in 'YYYY-MM-DD' format
			const date = new Date(day.timestamp * 1000);
			let year = date.getFullYear();
			let month = (date.getMonth() + 1).toString().padStart(2, '0');
			let dayString = date.getDate().toString().padStart(2, '0');
			const dateString = `${year}-${month}-${dayString}`;

			// Calculate the total cost for the day
			let totalCost = day.line_items.reduce((sum, item) => sum + item.cost, 0);

			return { date: this.convertDate(dateString), totalCost: (totalCost / 1000).toFixed(3) };
		});

		// Sort the days by total cost in descending order
		daysWithTotalCosts.sort((a, b) => b.totalCost - a.totalCost);

		// Return the top 10 days
		return daysWithTotalCosts.slice(0, 10);
	},
	calculatePercentageOfLimit: async () => {
		const cost = await this.getUsageData()
		const dailyCosts = cost.daily_costs;
		// Initialize total cost
		let totalCost = 0;

		// Loop over each day's costs
		dailyCosts.forEach(day => {
			// Loop over each line item in the day's costs
			day.line_items.forEach(item => {
				// Add the cost for this item to the total cost
				totalCost += item.cost / 1000;
			});
		});

		// Calculate the percentage of the hard limit
		const percentageOfLimit = (totalCost / 20) * 100;

		return percentageOfLimit;
	}



}