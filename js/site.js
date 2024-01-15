// format number to US dollar
let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

let today = new Date();
let extraPaymentsModal = document.getElementById('extraPaymentsModal');

function formatUSD(amount) {
    return USDollar.format(amount);
}

document.addEventListener('alpine:init', () => {

    // $('#amortizationTableBasic').DataTable({
    //     // columnDefs: [
    //     //     {orderable: false, targets: 0}
    //     // ],
    //     order: [[1, 'asc']],
    //     paging: true,
    //     ordering: false,
    //     autoWidth: false
    // });

    Alpine.data('amortizationData', () => ({
        loanAmount: 200000,
        formatedLoanAmount: 0,
        loanMonths: 360,
        interestRate: 7,
        loanStartDate: "2023-01-15",
        totalMonthlyPayment: 0,
        monthlyInterestRate: 0,
        periodList: [],
        extraPaymentLastPaymentPeriod: 0,
        amortizationTableBasic: [],
        totalInterestPaidBasic: 0,
        totalPrincipalPaidBasic: 0,
        totalPaidBasic: 0,
        percentInterestBasic: 0,
        percentPrincipalBasic: 0,
        extraPaymentsList: [],
        amortizationTableExtraPayments: [],
        totalInterestPaidExtraPayments: 0,
        totalPrincipalPaidExtraPayments: 0,
        totalPaidExtraPayments: 0,
        totalExtraPaidToPrincipal:0,
        percentInterestExtraPayments: 0,
        percentPrincipalExtraPayments: 0,
        extraPaymentAmount: 25,
        extraPaymentPeriodStart: 0,
        extraPaymentPeriodEnd: 0,
        showExtraPaymentErrorMessage: false,
        extraPaymentErrorMessage: "",
        differenceInMonths: 0,
        differenceInInterest: 0,
        updateExtraPayment: false,
        updateExtraPaymentId: 0,
        showAmortizationInfo: false,
        showInvestmentTab: false,
        estimatedAnnualRateOfReturn: 7,
        approxFutureValue: 0,
        clearArrays() {
            this.amortizationTableBasic = [];
            this.amortizationTableExtraPayments = [];
            this.periodList = [];
            this.extraPaymentsList = [];
        },
        calculateMonthlyInterestRate() {
            var interestRate = this.interestRate;
            
            if(interestRate > 1.0) {
                interestRate = interestRate / 100;
            }

            this.monthlyInterestRate = interestRate / 12;
        },
        calculateTotalMonthlyPayment() {
            this.totalMonthlyPayment = this.formatedLoanAmount * this.monthlyInterestRate * Math.pow(1 + this.monthlyInterestRate , this.loanMonths) / (Math.pow((1 + this.monthlyInterestRate), this.loanMonths) - 1);
        },
        isCurrentPeriod(period) {
            return (today.getMonth() == period.getMonth()) && (today.getFullYear() == period.getFullYear()) ? true : false;
        },
        getExtraPaymentForPeriod(paymentNumber) {

            var totalForPaymentNumber = 0;

            this.extraPaymentsList.forEach((extraPayment) => {
                if(parseInt(paymentNumber) >= parseInt(extraPayment.StartPeriod) && parseInt(paymentNumber) <= parseInt(extraPayment.EndPeriod)) {
                    totalForPaymentNumber += parseFloat(extraPayment.ExtraPaymentAmount);
                }
            });

            return totalForPaymentNumber;
        },
        generateAmortizationTableData(hasExtraPayments, tableArray) {

            var paymentNumber = 1;
            var balance = this.formatedLoanAmount;

            var runningPrincipalPaid = 0;
            var runningInterestPaid = 0;
            var runningtotalPaid = 0;

            var period = new Date(this.loanStartDate);

            while(paymentNumber <= this.loanMonths) {

                var thisMonthsInterestPaid = balance * this.monthlyInterestRate;
                
                var paymentThisMonth = this.totalMonthlyPayment;

                var lastPayment = false;

                if((balance + thisMonthsInterestPaid) < paymentThisMonth) {
                    paymentThisMonth = balance + thisMonthsInterestPaid;
                    lastPayment = true;
                }

                var thisMonthsPrincipalPaid = paymentThisMonth - thisMonthsInterestPaid;
                var originalAmountToPrincipal = thisMonthsPrincipalPaid;

                var paymentBeforeExtra = paymentThisMonth;

                if(hasExtraPayments && !lastPayment) {
                    this.totalExtraPaidToPrincipal += this.getExtraPaymentForPeriod(paymentNumber);
                    paymentThisMonth += this.getExtraPaymentForPeriod(paymentNumber);
                    thisMonthsPrincipalPaid += this.getExtraPaymentForPeriod(paymentNumber);
                }

                runningInterestPaid += thisMonthsInterestPaid;
                runningPrincipalPaid += thisMonthsPrincipalPaid;

                runningtotalPaid += paymentThisMonth;

                var endingBalance = balance - thisMonthsPrincipalPaid;

                var paymentPeriodString = (period.getMonth() + 1) + "/" + period.getFullYear();

                if(!hasExtraPayments) {
                    this.periodList.push({
                        Option: paymentPeriodString,
                        Value: paymentNumber
                    });
                }
                
                var thisMonthData = {
                    CurrentPeriod: this.isCurrentPeriod(period),
                    PaymentBeforeExtra: paymentBeforeExtra,
                    PaymentNumber: paymentNumber,
                    PaymentPeriod: paymentPeriodString,
                    Payment: !lastPayment ? paymentThisMonth : (balance + thisMonthsInterestPaid),
                    InterestPaidThisMonth: thisMonthsInterestPaid,
                    PrincipalPaidThisMonth: thisMonthsPrincipalPaid,
                    EndingBalance: endingBalance,
                    RunningInterestPaid: runningInterestPaid,
                    RunningPrincipalPaid: runningPrincipalPaid,
                    RunningtotalPaid: runningtotalPaid,
                    ExtraPayment: hasExtraPayments && !lastPayment ? this.getExtraPaymentForPeriod(paymentNumber) : 0,
                    OriginalPrincipalPaid: originalAmountToPrincipal
                }

                tableArray.push(thisMonthData);
                balance = endingBalance;

                if(lastPayment) {

                    if(hasExtraPayments) {
                        this.extraPaymentLastPaymentPeriod = paymentNumber;
                    }

                    break;
                }

                period = new Date(period.setMonth(period.getMonth() + 1))
                
                paymentNumber += 1;
            }

            return [runningInterestPaid, runningPrincipalPaid, runningtotalPaid];
        },
        calculateTotalInterestPaidPercent(totalInterestPaid, totalPaid) {
            return (totalInterestPaid / totalPaid) * 100;
        },
        calculateTotalPrincipalPaidPercent(totalPrincipalPaid, totalPaid) {
            return (totalPrincipalPaid / totalPaid) * 100;
        },
        calculateAmortizationBasic() {
            let amortizationReturnValues = this.generateAmortizationTableData(false, this.amortizationTableBasic);

            this.totalInterestPaidBasic = amortizationReturnValues[0],
            this.totalPrincipalPaidBasic = amortizationReturnValues[1],
            this.totalPaidBasic = amortizationReturnValues[2];

            var totalInterestPaidPercentBasic = this.calculateTotalInterestPaidPercent(this.totalInterestPaidBasic, this.totalPaidBasic);
            var totalPrincipalPaidPercentBasic = this.calculateTotalPrincipalPaidPercent(this.totalPrincipalPaidBasic, this.totalPaidBasic);

            this.percentInterestBasic = totalInterestPaidPercentBasic.toFixed(2) + " %";
            this.percentPrincipalBasic = totalPrincipalPaidPercentBasic.toFixed(2) + " %";
        },
        calculateAmortizationExtraPayments() {
            let amortizationReturnValues = this.generateAmortizationTableData(true, this.amortizationTableExtraPayments);

            this.totalInterestPaidExtraPayments = amortizationReturnValues[0],
            this.totalPrincipalPaidExtraPayments = amortizationReturnValues[1],
            this.totalPaidExtraPayments = amortizationReturnValues[2];

            var totalInterestPaidPercentExtraPayments = this.calculateTotalInterestPaidPercent(this.totalInterestPaidExtraPayments, this.totalPaidExtraPayments);
            var totalPrincipalPaidPercentExtraPayments = this.calculateTotalPrincipalPaidPercent(this.totalPrincipalPaidExtraPayments, this.totalPaidExtraPayments);

            this.percentInterestExtraPayments = totalInterestPaidPercentExtraPayments.toFixed(2) + " %";
            this.percentPrincipalExtraPayments = totalPrincipalPaidPercentExtraPayments.toFixed(2) + " %";

            var totalPeriodsExtraPayment = this.amortizationTableExtraPayments[this.amortizationTableExtraPayments.length - 1].PaymentNumber;

            this.differenceInMonths = this.loanMonths - totalPeriodsExtraPayment;
            this.differenceInInterest = this.totalInterestPaidBasic - this.totalInterestPaidExtraPayments;

            this.calculatePotentialFutureInvestments();
        },
        calculateAmortization() {
            this.calculateAmortizationBasic();
            this.calculateAmortizationExtraPayments();
        },
        createPrincipalVsInterestBasicPieChart() {

            //var basicCanvas = document.getElementById("principalVsInterestBasicPieChart");

            // JS - Destroy exiting Chart Instance to reuse <canvas> element
            let chartStatus = Chart.getChart("principalVsInterestBasicPieChart"); // <canvas> id
            if (chartStatus != undefined) {
                chartStatus.destroy();
            }
            //-- End of chart destroy 


            const principalVsInterestBasicPieChart = new Chart(document.getElementById("principalVsInterestBasicPieChart"), {
                type: 'pie',
                data: {
                labels: ["Total Interest Paid", "Total Principal Paid"],
                datasets: [{
                    backgroundColor: ["#ed1a1a", "#14db0d"],
                    data: [this.calculateTotalInterestPaidPercent(this.totalInterestPaidBasic, this.totalPaidBasic), this.calculateTotalPrincipalPaidPercent(this.totalPrincipalPaidBasic, this.totalPaidBasic)]
                }]
                },
                options: {
                plugins: {
                    title: {
                    display: true,
                    text: 'Interest Vs Principal'
                    }
                },
                responsive: true,
                }
            });
        },
        createPrincipalVsInterestExtraPaymentPieChart() {

            // JS - Destroy exiting Chart Instance to reuse <canvas> element
            let chartStatus = Chart.getChart("principalVsInterestExtraPaymentsPieChart"); // <canvas> id
            if (chartStatus != undefined) {
                chartStatus.destroy();
            }
            //-- End of chart destroy 


            const principalVsInterestExtraPaymentsPieChart = new Chart(document.getElementById("principalVsInterestExtraPaymentsPieChart"), {
                type: 'pie',
                data: {
                labels: ["Total Interest Paid", "Total Principal Paid"],
                datasets: [{
                    backgroundColor: ["#ed1a1a", "#14db0d"],
                    data: [this.calculateTotalInterestPaidPercent(this.totalInterestPaidExtraPayments, this.totalPaidExtraPayments), this.calculateTotalPrincipalPaidPercent(this.totalPrincipalPaidExtraPayments, this.totalPaidExtraPayments)]
                }]
                },
                options: {
                plugins: {
                    title: {
                    display: true,
                    text: 'Interest Vs Principal'
                    }
                },
                responsive: true,
                }
            });
        },
        calculate() {
            this.clearArrays();

            this.formatedLoanAmount = this.loanAmount.replace(",", "");
            
            this.calculateMonthlyInterestRate();

            this.calculateTotalMonthlyPayment();

            this.calculateAmortization();

            this.createPrincipalVsInterestBasicPieChart();

            this.createPrincipalVsInterestExtraPaymentPieChart();

            this.showAmortizationInfo = true;

            // amortizationTableBasic = new DataTable('#amortizationTableBasic', {
            //     info: false,
            //     ordering: false,
            //     paging: false,
            //     order: [[1, 'asc']]
            // });
            // amortizationTableExtraPayment = new DataTable('#amortizationTableExtraPayment', {
            //     info: false,
            //     ordering: false,
            //     paging: false,
            //     order: [[1, 'asc']]
            // });
        },
        resetExtraPaymentModal() {
            this.extraPaymentAmount = 0;
            this.extraPaymentPeriodStart = 0;
            this.extraPaymentPeriodEnd = 0;
            this.showExtraPaymentErrorMessage = false;
            this.extraPaymentErrorMessage = "";
        },
        removeExtraPayment() {
            const indexOf = this.extraPaymentsList.map(e => e.Id).indexOf(this.updateExtraPaymentId);

            this.extraPaymentsList.splice(indexOf, 1);

            var modal = bootstrap.Modal.getInstance(extraPaymentsModal)
            modal.hide();

            this.updateExtraPaymentId = 0;

            this.recalculateExtraPayment();

        },
        recalculateExtraPayment() {

            if(parseInt(this.extraPaymentPeriodEnd) < parseInt(this.extraPaymentPeriodStart)) {
                this.extraPaymentErrorMessage = "You cannot have a Start Period after an End Period!";
                this.showExtraPaymentErrorMessage = true;

                return;
            }

            var numberOfExtraPayments = this.extraPaymentsList.length + 1;

            if(!this.updateExtraPayment) {

                this.extraPaymentsList.push({
                    Id: numberOfExtraPayments,
                    StartPeriod: this.extraPaymentPeriodStart,
                    EndPeriod: this.extraPaymentPeriodEnd,
                    ExtraPaymentAmount: this.extraPaymentAmount,
                    StartPeriodString: this.getPeriodListOptionText(this.extraPaymentPeriodStart),
                    EndPeriodString: this.getPeriodListOptionText(this.extraPaymentPeriodEnd)
                });

            }
            else{
                
                if(this.updateExtraPaymentId > 0) {
                    var result = this.getExtraPayment(this.updateExtraPaymentId);

                    result.StartPeriod = this.extraPaymentPeriodStart;
                    result.EndPeriod = this.extraPaymentPeriodEnd;
                    result.ExtraPaymentAmount = this.extraPaymentAmount;
                    result.StartPeriodString = this.getPeriodListOptionText(this.extraPaymentPeriodStart);
                    result.EndPeriodString = this.getPeriodListOptionText(this.extraPaymentPeriodEnd);
                }
                
                this.updateExtraPayment = false;
                this.updateExtraPaymentId = 0;
            }

            if(this.extraPaymentsList.length > 0) {
                const sum = this.extraPaymentsList.map(item => item.ExtraPaymentAmount).reduce((prev, curr) => prev + curr, 0);
                
                if(parseInt(sum) > 0) {
                    this.showInvestmentTab = true;
                }
                else {
                    this.showInvestmentTab = false;
                }
            }
            else {
                this.showInvestmentTab = false;
            }

            var modal = bootstrap.Modal.getInstance(extraPaymentsModal)
            modal.hide();

            this.resetExtraPaymentModal();

            this.amortizationTableExtraPayments = [];
            this.calculateAmortizationExtraPayments();

            this.createPrincipalVsInterestExtraPaymentPieChart();
        },
        getPeriodListOptionText(period) {
            var result = this.periodList.find(x => {
                return parseInt(x.Value) === parseInt(period)
            });

            return result.Option;
        },
        getExtraPayment(extraPaymentId) {
            var result = this.extraPaymentsList.find(x => {
                return parseInt(x.Id) === parseInt(extraPaymentId)
            });

            return result;
        },
        editExtraPayment(extraPaymentId) {
            var result = this.getExtraPayment(extraPaymentId);

            this.extraPaymentPeriodStart = result.StartPeriod;
            this.extraPaymentPeriodEnd = result.EndPeriod;
            this.extraPaymentAmount = result.ExtraPaymentAmount

            this.updateExtraPayment = true;
            this.updateExtraPaymentId = extraPaymentId;

            var modal = bootstrap.Modal.getInstance(extraPaymentsModal)
            modal.show();
        },
        calculatePotentialFutureInvestments() {
            var balance = 0;

            var i = 0;
            while(i < this.amortizationTableExtraPayments.length) {

                balance = this.calculateFutureValue(balance, this.amortizationTableExtraPayments[i].ExtraPayment);
                
                i += 1;
            }

            this.approxFutureValue = balance;
        },
        calculateFutureValue(balance, extraPayment) {
        
            var monthlyRateOfReturn = this.estimatedAnnualRateOfReturn;
            
            if(monthlyRateOfReturn > 1.0) {
                monthlyRateOfReturn = monthlyRateOfReturn / 100;
            }

            monthlyRateOfReturn = monthlyRateOfReturn / 12;

            var onePlusRToTheN = (1 + monthlyRateOfReturn)**1

            var futureValue = (balance + extraPayment) * onePlusRToTheN;

            return futureValue;
        }
    }))
});