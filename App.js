import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Platform, Dimensions, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// New Luma-inspired Color Palette
const COLORS = {
  background: '#1A1A2E', // Deep dark blue/purple
  cardBackground: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
  inputBackground: 'rgba(255, 255, 255, 0.15)', // Slightly more opaque for inputs
  outputBackground: 'rgba(255, 255, 255, 0.08)', // Subtle difference for output area
  primaryText: '#E0E0E0', // Light gray for primary text
  secondaryText: '#B0B0B0', // Dimmer gray for secondary text
  accentGreen: '#50FA7B', // Vibrant green for header (like Dracula theme green)
  recyclable: '#50FA7B', // Vibrant green for "YES"
  notRecyclable: '#FF5555', // Vibrant red for "NO"
  iconColor: '#BD93F9', // Vibrant purple for icons
  borderColor: 'rgba(255, 255, 255, 0.2)', // Light semi-transparent border
  shadowColor: 'rgba(0, 0, 0, 0.5)', // Darker shadow for depth, or could be a light glow
  placeholderTextColor: '#A0A0A0', // Specific placeholder color
  activityIndicatorColor: '#BD93F9', // Color for the loading spinner
};

const App = () => {
  const [inputValue, setInputValue] = useState('');
  const [postcodeValue, setPostcodeValue] = useState(''); // New state for postcode
  const [submittedItem, setSubmittedItem] = useState('');
  const [submittedPostcode, setSubmittedPostcode] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isRecyclable, setIsRecyclable] = useState(null);
  const [stagedImageUri, setStagedImageUri] = useState(null); // Image URI staged for submission
  const [submittedImageDisplayUri, setSubmittedImageDisplayUri] = useState(null); // Image URI that was part of the last submission
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImgUri = result.assets[0].uri;
      console.log("Staging image:", selectedImgUri);
      setStagedImageUri(selectedImgUri);
      // Do not submit or show output here, just stage the image.
      // User can now type text or postcode before hitting submit.
    }
  };

  const handleSubmit = async () => {
    const trimmedInput = inputValue.trim();
    const trimmedPostcode = postcodeValue.trim();

    // Check if there's any input (text or staged image)
    if (!trimmedInput && !stagedImageUri) {
      console.log("No item text or image provided for submission.");
      // Optionally, show an alert to the user.
      return;
    }
    // Postcode check can remain or be adjusted based on requirements
    // For now, let's assume postcode is optional if an image is present.
    if (!trimmedPostcode && !stagedImageUri && trimmedInput) {
        console.log("Postcode not provided for text input (optional).");
    }

    setLoading(true);
    setShowOutput(false); // Hide previous output immediately

    // Determine submitted item name
    let currentSubmittedItemName = trimmedInput;
    if (stagedImageUri && !trimmedInput) {
      currentSubmittedItemName = "Uploaded Image";
    } else if (stagedImageUri && trimmedInput) {
      currentSubmittedItemName = `${trimmedInput}`;
    }
    setSubmittedItem(currentSubmittedItemName);
    setSubmittedPostcode(trimmedPostcode);
    setSubmittedImageDisplayUri(stagedImageUri); // Set the image that will be displayed in output

    // Clear inputs now
    setInputValue('');
    setPostcodeValue('');
    setStagedImageUri(null); // Clear the staged image after it's been "submitted"

    try {
      // Simulate API call
      // In a real app, you'd send: trimmedInput, trimmedPostcode, and stagedImageUri (or the image file)
      console.log("Submitting: Item Text:", trimmedInput, "Postcode:", trimmedPostcode, "Image URI:", submittedImageDisplayUri);
      const dummyApiResponse = Math.random() > 0.5; // Dummy YES/NO
      // Example:
      // const response = await fetch('https://your-api.com/check', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ item: trimmedInput }),
      // });
      // const data = await response.json();
      // setIsRecyclable(data.recyclable);

      setTimeout(() => {
        setIsRecyclable(dummyApiResponse);
        setShowOutput(true);
        setLoading(false);
      }, 800); // Simulate network delay
    } catch (error) {
      console.error("API error:", error);
      setIsRecyclable(null);
      setShowOutput(false);
      setLoading(false);
    }
  };

  const outputData = {
    itemName: submittedItem,
    status: isRecyclable === true ? "YES - Recyclable!" :
            isRecyclable === false ? "NO - Not Recyclable" : "Unknown",
    statusColor: isRecyclable === true ? COLORS.recyclable :
                 isRecyclable === false ? COLORS.notRecyclable : COLORS.secondaryText,
    binInfo: isRecyclable ? "Put in: Green Recycling Bin" : "Put in: General Waste",
    tip: isRecyclable
      ? "Make sure it's empty, rinsed, and the cap is on!"
      : "Check for alternative recycling points near you.",
    councilName: submittedPostcode ? `Council for ${submittedPostcode}` : "Anytown Council", // Dummy council name
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
        <View style={styles.card}>
          <Text style={styles.headerText}>RecycleRight UK</Text>

          {loading && <ActivityIndicator size="large" color={COLORS.activityIndicatorColor} style={{ marginBottom: 15 }} />}

          {showOutput && !loading && (
            <View style={styles.outputContainer}>
              {submittedImageDisplayUri && ( // Display the image that was part of the submission
                <Image
                  source={{ uri: submittedImageDisplayUri }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.outputItemName}>{outputData.itemName}</Text>
              <Text style={[styles.outputStatus, { color: outputData.statusColor }]}>
                {outputData.status}
              </Text>
              <Text style={styles.outputBinInfo}>{outputData.binInfo}</Text>
              <Text style={styles.outputCouncilInfo}>{outputData.councilName}</Text> {/* New council display */}
              <Text style={styles.outputTip}>Tip: {outputData.tip}</Text>
            </View>
          )}

          <View style={styles.spacer} />

          {/* Postcode Input Field */}
          <TextInput
            style={styles.postcodeTextInput}
            placeholder="Enter your postcode (e.g., SW1A 1AA)"
            placeholderTextColor={COLORS.placeholderTextColor}
            value={postcodeValue}
            onChangeText={setPostcodeValue}
            onSubmitEditing={handleSubmit} // Optional: allow submitting from postcode field
            keyboardAppearance="dark" // For iOS dark keyboard
          />

          {/* Optional: Visual cue for staged image */}
          {stagedImageUri && (
            <Text style={styles.stagedImageText}>Image selected, ready to submit.</Text>
          )}

          <View style={styles.inputBar}>
            <TouchableOpacity onPress={handleImageUpload} style={styles.iconButton}>
              <Text style={styles.iconText}>📷</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder={stagedImageUri ? "Add details (optional)" : "Type item or upload image..."}
              placeholderTextColor={COLORS.placeholderTextColor}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSubmit}
              keyboardAppearance="dark" // For iOS dark keyboard
            />
            <TouchableOpacity onPress={handleSubmit} style={styles.iconButton}>
              <Text style={styles.iconText}>➔</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 10,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.cardBackground, // Semi-transparent
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? Math.min(screenWidth - 40, 500) : '90%',
    maxWidth: 500,
    minHeight: Platform.OS === 'web' ? 480 : '75%', // Slightly increased min height
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 6 }, // Adjusted shadow
    shadowOpacity: Platform.OS === 'web' ? 0.3 : 0.6, // Stronger shadow for depth
    shadowRadius: 10,
    elevation: 8, // For Android shadow
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1, // Subtle border for definition
    borderColor: COLORS.borderColor,
  },
  headerText: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: COLORS.accentGreen, // Vibrant green
    textAlign: 'center',
    marginBottom: 25,
  },
  outputContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: COLORS.outputBackground, // Semi-transparent
    borderRadius: 15, // More rounded
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  uploadedImage: { // Style for the uploaded image in output
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  outputItemName: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.primaryText, // Light text
    marginBottom: 8,
  },
  outputStatus: {
    fontSize: Platform.OS === 'web' ? 22 : 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    // Color is set dynamically
  },
  outputBinInfo: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: COLORS.secondaryText, // Dimmer light text
    marginBottom: 5,
  },
  outputTip: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: COLORS.secondaryText, // Dimmer light text
    fontStyle: 'italic',
  },
  outputCouncilInfo: {
    fontSize: Platform.OS === 'web' ? 17 : 15,
    color: COLORS.secondaryText, // Dimmer light text
    marginBottom: 5,
    fontWeight: '500',
  },
  stagedImageText: { // Style for the staged image indicator
    color: COLORS.placeholderTextColor,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  spacer: {
    flex: 1,
  },
  postcodeTextInput: {
    height: 50, // Increased height
    backgroundColor: COLORS.inputBackground, // Semi-transparent
    borderRadius: 25, // Fully rounded
    paddingHorizontal: 20,
    fontSize: Platform.OS === 'web' ? 17 : 15,
    color: COLORS.primaryText, // Light text
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    width: '100%',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground, // Semi-transparent
    borderRadius: 25, // Fully rounded
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'web' ? 8 : 6, // Slightly reduced vertical padding
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  iconButton: {
    padding: 12, // Slightly increased padding
  },
  iconText: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    color: COLORS.iconColor, // Vibrant icon color
  },
  textInput: {
    flex: 1,
    height: 48, // Increased height to match postcode input
    fontSize: Platform.OS === 'web' ? 17 : 15,
    color: COLORS.primaryText, // Light text
    marginLeft: 8,
    marginRight: 8,
  },
});

export default App;
