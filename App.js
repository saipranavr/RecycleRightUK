import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';

// Eco-friendly color palette
const COLORS = {
  background: '#F0F4F8', // Light grayish blue - clean and modern
  cardBackground: '#FFFFFF',
  primaryText: '#333333',
  secondaryText: '#555555',
  accentGreen: '#2E7D32', // A friendly, earthy green for the header
  recyclable: '#4CAF50', // Green for "YES"
  notRecyclable: '#D32F2F', // Red for "NO"
  inputBarBackground: '#E8EAF6', // Light lavender, soft
  iconColor: '#3949AB', // Indigo for icons
  borderColor: '#CFD8DC', // Light border color
  shadowColor: '#000',
};

const App = () => {
  const [inputValue, setInputValue] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isRecyclableDummy, setIsRecyclableDummy] = useState(true);

  const handleImageUpload = () => {
    console.log("Image upload clicked");
    // In a real app, this would trigger image selection
  };

  const handleSubmit = () => {
    if (inputValue.trim() === '') {
      // Optionally, handle empty input submission, e.g., show a small message
      // For now, we'll allow it to proceed to show the dummy output.
    }
    console.log("Submitted text:", inputValue);
    setShowOutput(true);
    setIsRecyclableDummy(prev => !prev); // Toggle for variety
    setInputValue(''); // Clear input field
  };

  // Dummy output content - alternates based on isRecyclableDummy
  const outputData = isRecyclableDummy
    ? {
        itemName: "Plastic Bottle",
        status: "YES - Recyclable!",
        statusColor: COLORS.recyclable,
        binInfo: "Put in: Green Recycling Bin",
        tip: "Make sure it's empty, rinsed, and the cap is on!",
      }
    : {
        itemName: "Crisp Packet",
        status: "NO - Not Recyclable",
        statusColor: COLORS.notRecyclable,
        binInfo: "Put in: General Waste",
        tip: "Most crisp packets are made of mixed materials.",
      };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
        <View style={styles.card}>
          <Text style={styles.headerText}>RecycleRight UK</Text>

          {showOutput && (
            <View style={styles.outputContainer}>
              <Text style={styles.outputItemName}>{outputData.itemName}</Text>
              <Text style={[styles.outputStatus, { color: outputData.statusColor }]}>
                {outputData.status}
              </Text>
              <Text style={styles.outputBinInfo}>{outputData.binInfo}</Text>
              <Text style={styles.outputTip}>Tip: {outputData.tip}</Text>
            </View>
          )}

          {/* This spacer ensures the input bar is pushed down when output is not visible,
              or provides space above input bar when output is visible.
              Adjust flex value as needed for desired spacing. */}
          <View style={styles.spacer} />

          <View style={styles.inputBar}>
            <TouchableOpacity onPress={handleImageUpload} style={styles.iconButton}>
              <Text style={styles.iconText}>📷</Text> {/* Simple camera emoji as icon */}
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type item or upload image..."
              placeholderTextColor={COLORS.secondaryText}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSubmit} // Allows submission via keyboard 'enter' key
            />
            <TouchableOpacity onPress={handleSubmit} style={styles.iconButton}>
              <Text style={styles.iconText}>➔</Text> {/* Simple arrow emoji as icon */}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appContainer: {
    flex: 1,
    justifyContent: 'center', // Centers the card vertically
    alignItems: 'center', // Centers the card horizontally
    padding: Platform.OS === 'web' ? 20 : 10, // More padding on web for a spacious feel
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20, // Duolingo-esque rounded corners
    padding: 20,
    width: Platform.OS === 'web' ? Math.min(screenWidth - 40, 500) : '90%', // Responsive width
    maxWidth: 500, // Max width for web to maintain card-like appearance
    minHeight: Platform.OS === 'web' ? 450 : '70%', // Ensure card has enough height
    shadowColor: COLORS.shadowColor, // Subtle shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // For Android shadow
    display: 'flex', // Use flexbox for internal layout
    flexDirection: 'column', // Stack children vertically
  },
  headerText: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: COLORS.accentGreen,
    textAlign: 'center',
    marginBottom: 25, // Space below header
  },
  outputContainer: {
    marginBottom: 20, // Space below output section
    padding: 15,
    backgroundColor: '#F9F9F9', // Slightly different background for output
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  outputItemName: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 8,
  },
  outputStatus: {
    fontSize: Platform.OS === 'web' ? 22 : 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  outputBinInfo: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: COLORS.secondaryText,
    marginBottom: 5,
  },
  outputTip: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },
  spacer: {
    flex: 1, // This pushes the inputBar to the bottom of the card
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBarBackground,
    borderRadius: 25, // Rounded bar
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    marginTop: 'auto', // Pushes to the bottom if not enough content above
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  iconButton: {
    padding: 10,
  },
  iconText: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    color: COLORS.iconColor,
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: COLORS.primaryText,
    marginLeft: 8,
    marginRight: 8,
  },
});

export default App;
