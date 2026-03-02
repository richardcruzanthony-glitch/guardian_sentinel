// Fixed cost calculation logic for Bug #1
const calculateTotalCost = (materialCost, laborCost, shippingCost, margin) => {
    const totalCost = materialCost + laborCost + shippingCost;
    return totalCost + (totalCost * margin);
};

// Enhanced ProcurementAgent prompt for Bug #2
class ProcurementAgent {
    promptForCosts() {
        const materialCost = parseFloat(prompt('Enter the material cost:'));
        const laborCost = parseFloat(prompt('Enter the labor cost:'));
        const shippingCost = parseFloat(prompt('Enter the shipping cost:'));
        const margin = 0.1; // 10% margin
        if (isNaN(materialCost) || isNaN(laborCost) || isNaN(shippingCost)) {
            throw new Error('Invalid cost input. Please enter numeric values.');
        }
        return calculateTotalCost(materialCost, laborCost, shippingCost, margin);
    }
}

// CNC operations with bubble annotation references for Bug #3
class CNCOperations {
    performCutting(material) {
        // Bubble Annotation: Cutting process
        console.log(`Cutting the material: ${material}`);
    }
    performMilling(material) {
        // Bubble Annotation: Milling process
        console.log(`Milling the material: ${material}`);
    }
}