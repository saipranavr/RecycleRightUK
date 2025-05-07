import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Platform, Dimensions, Image, ActivityIndicator, Linking, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import './global.css';

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
  const [loading, setLoading] = useState(false); // For main recyclability check
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [reuseIdeas, setReuseIdeas] = useState([]);
  const [loadingReuseIdeas, setLoadingReuseIdeas] = useState(false);
  const [apiRawResponse, setApiRawResponse] = useState(''); // For the new API's raw_response
  const [apiReason, setApiReason] = useState(''); // For the new API's reason

  // --- IMPORTANT SECURITY WARNING ---
  // The API key below is exposed in client-side code.
  // This is highly insecure for production apps.
  // Consider moving API calls to a backend server.
  
  // --- END SECURITY WARNING ---

  const RECYCLING_FACTS = [
    "UK households produce over 26 million tonnes of waste each year.",
    "Recycling one aluminum can save enough energy to run a TV for 3 hours.",
    "Glass is 100% recyclable and can be recycled endlessly without loss in quality.",
    "Around 80% of the things we throw away could be recycled.",
    "Plastic bags can take up to 1,000 years to decompose in landfills.",
    "The average person in the UK throws away their body weight in rubbish every seven weeks.",
    "Contamination is a major issue in recycling – always clean your recyclables!"
  ];
  const SAVED_POSTCODE_KEY = '@RecycleRightUK_savedPostcode';

  useEffect(() => {
    const loadSavedPostcode = async () => {
      try {
        const savedPostcode = await AsyncStorage.getItem(SAVED_POSTCODE_KEY);
        if (savedPostcode !== null) {
          setPostcodeValue(savedPostcode);
          setSubmittedPostcode(savedPostcode); // To pre-fill council name if app opens with saved postcode
          console.log('Loaded saved postcode:', savedPostcode);
        }
      } catch (e) {
        console.error('Failed to load postcode.', e);
      }
    };
    loadSavedPostcode();
  }, []);


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
    setShowOutput(false); // Hide previous output for main result
    setReuseIdeas([]); // Clear previous reuse ideas

    // Determine submitted item name
    let currentSubmittedItemName = trimmedInput;
    if (stagedImageUri && !trimmedInput) {
      currentSubmittedItemName = "Uploaded Image";
    } else if (stagedImageUri && trimmedInput) {
      currentSubmittedItemName = `${trimmedInput}`;
    }
    setSubmittedItem(currentSubmittedItemName);
    setSubmittedPostcode(trimmedPostcode);
    setSubmittedImageDisplayUri(stagedImageUri);

    // Save postcode if valid
    if (trimmedPostcode) {
      try {
        await AsyncStorage.setItem(SAVED_POSTCODE_KEY, trimmedPostcode);
        console.log('Saved postcode:', trimmedPostcode);
      } catch (e) {
        console.error('Failed to save postcode.', e);
      }
    }

    // Clear inputs now
    setInputValue('');
    // Keep postcodeValue in the input if the user wants to reuse it, or clear it:
    // setPostcodeValue(''); // Uncomment to clear postcode input after each submission
    setStagedImageUri(null); // Clear staged image after it's been included in submission logic

    const formData = new FormData();
    formData.append('query', trimmedInput || "how to recycle this"); // Use input or default query
    formData.append('postcode', trimmedPostcode);

    if (stagedImageUri) {
      try {
        const imageResponse = await fetch(stagedImageUri);
        const blob = await imageResponse.blob(); // Get the blob data
        
        const fileName = "image.jpg"; // Keep a static filename for simplicity with FastAPI

        console.log(`Appending image blob: name='${fileName}', type='${blob.type}' (blob's actual type)`);
        
        // Append the blob directly. The third argument (filename) is crucial for FastAPI to recognize it as a file.
        formData.append('image', blob, fileName);

      } catch (e) {
        console.error("Error fetching or processing image blob:", e);
        setApiRawResponse('');
        setApiReason(`Error processing image: ${e.message}`);
        setIsRecyclable(null);
        setShowOutput(true);
        setLoading(false);
        return;
      }
    }

    try {
      // Check what FormData contains before sending (for debugging, not for production)
      // This kind of inspection is tricky with FormData directly in JS.
      // We rely on the console.log below to confirm parts.
      console.log("Submitting to local API. Query:", formData.get('query'), "Postcode:", formData.get('postcode'), "Image field present:", !!formData.get('image'));

      const response = await fetch('http://127.0.0.1:8003/analyze/image', {
        method: 'POST',
        body: formData,
        // headers: { 'Content-Type': 'multipart/form-data' }, // Usually not needed and can cause issues
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Local API Error Response Text:", errorText);
        let errorJson = {};
        try {
            errorJson = JSON.parse(errorText);
        } catch (e) { /* ignore if not json */ }
        throw new Error(`Local API Error: ${response.status} - ${errorJson.detail || errorText}`);
      }

      const data = await response.json();
      console.log("Local API Response:", data);

      // Update state based on API response
      // How to interpret data.recyclable === null? For now, treat as unknown.
      if (data.recyclable === true) {
        setIsRecyclable(true);
      } else if (data.recyclable === false) {
        setIsRecyclable(false);
      } else {
        setIsRecyclable(null); // Or some other state to indicate "Check details"
      }
      setApiRawResponse(data.raw_response || '');
      setApiReason(data.reason || '');

      setShowOutput(true);
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % RECYCLING_FACTS.length);
      fetchReuseIdeasFromGPT(currentSubmittedItemName);

    } catch (error) {
      console.error("Error submitting to local API:", error);
      setApiRawResponse('');
      setApiReason(`Error: ${error.message}`);
      setIsRecyclable(null); // Reset recyclability status on error
      setShowOutput(true); // Still show output card to display the error
    } finally {
      setLoading(false);
    }
  };

  // outputData will now be constructed more directly in the JSX
  // or we can adjust it to use apiRawResponse and apiReason

  const fetchReuseIdeasFromGPT = async (itemName) => {
    if (!itemName || itemName.trim() === "" || itemName.toLowerCase() === "uploaded image") {
      // Avoid calling API for generic "Uploaded Image" or empty string
      // Provide a specific message if it's just an image without description
      setReuseIdeas(itemName.toLowerCase() === "uploaded image" ? ["Please describe the uploaded image for specific reuse ideas."] : []);
      setLoadingReuseIdeas(false);
      return;
    }
    setLoadingReuseIdeas(true);
    setReuseIdeas([]);

    const prompt = `Give me 2 practical and two creative reuse or upcycling ideas for this item: "${itemName}". Keep them short and useful. Provide the output as a numbered list (e.g., 1. Idea one. 2. Idea two.).`;
    console.log("Fetching reuse ideas from GPT for:", itemName);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant who gives concise, eco-friendly reuse ideas as a numbered list." },
            { role: "user", content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API Error:", response.status, errorData);
        throw new Error(`OpenAI API Error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        const parsedIdeas = content.split('\n')
          .map(idea => idea.replace(/^\d+\.\s*/, '').trim()) // Remove "1. ", "2. ", etc.
          .filter(idea => idea.length > 0); // Remove any empty lines
        setReuseIdeas(parsedIdeas.slice(0, 4)); // Take up to 4 ideas
      } else {
        setReuseIdeas(["Could not fetch ideas at this time."]);
      }
    } catch (error) {
      console.error("Failed to fetch reuse ideas:", error);
      setReuseIdeas([`Sorry, an error occurred: ${error.message}`]);
    } finally {
      setLoadingReuseIdeas(false);
    }
  };


  const handleCouncilGuideLink = () => {
    // outputData was removed, use submittedPostcode directly or from state if needed for council name
    const councilName = submittedPostcode ? `Council for ${submittedPostcode}` : "My Council";
    console.log(`Clicked council guide link for: ${councilName}`);
    const dummyCouncilUrl = `https://www.google.com/search?q=recycling+guide+${councilName.replace(/\s/g, '+')}`;
    Linking.canOpenURL(dummyCouncilUrl).then(supported => {
      if (supported) {
        Linking.openURL(dummyCouncilUrl);
      } else {
        console.log("Don't know how to open URI: " + dummyCouncilUrl);
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.appContainer}>
          <View style={styles.cardsRowContainer}>
            {/* Main Card */}
            <View style={styles.mainCard}>
              <Text style={styles.headerText}>RecycleRight UK</Text>
            <Text style={styles.factText}>Did you know? {RECYCLING_FACTS[currentFactIndex]}</Text>

            {loading && <ActivityIndicator size="large" color={COLORS.activityIndicatorColor} style={styles.activityIndicator} />}

            {showOutput && !loading && (
              <View style={styles.outputContainer}>
                {submittedImageDisplayUri && (
                  <Image
                    source={{ uri: submittedImageDisplayUri }}
                    style={styles.uploadedImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.outputItemName}>{submittedItem}</Text>
                
                {/* Displaying Recyclability Status based on API */}
                <Text style={[
                  styles.outputStatus,
                  { color: isRecyclable === true ? COLORS.recyclable : isRecyclable === false ? COLORS.notRecyclable : COLORS.secondaryText }
                ]}>
                  {isRecyclable === true ? "YES - Recyclable!" : isRecyclable === false ? "NO - Not Recyclable" : (apiRawResponse ? "Check Details Below" : "Status Unknown")}
                </Text>

                {/* Displaying Raw Response from API */}
                {apiRawResponse && (
                  <View>
                    <Text style={styles.apiResponseHeader}>Recycling Instructions:</Text>
                    <Text style={styles.apiResponseText}>{apiRawResponse}</Text>
                  </View>
                )}

                {/* Displaying Reason from API if available */}
                {apiReason && (
                  <View style={{marginTop: 10}}>
                    <Text style={styles.apiResponseHeader}>Note:</Text>
                    <Text style={styles.apiResponseText}>{apiReason}</Text>
                  </View>
                )}
                
                <Text style={styles.outputCouncilInfo}>{submittedPostcode ? `Council for ${submittedPostcode}` : "My Council"}</Text>
                
                {submittedPostcode && (
                  <TouchableOpacity onPress={handleCouncilGuideLink} style={styles.councilGuideButton}>
                    <Text style={styles.councilGuideButtonText}>See what {submittedPostcode ? `Council for ${submittedPostcode}` : "My Council"} accepts</Text>
                  </TouchableOpacity>
                )}
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
            {/* End of Main Card inputs */}
            </View> 
            {/* End of Main Card View */}

            {/* Reuse Ideas Card - Conditionally rendered to the side on web, stacked on mobile */}
            {showOutput && submittedItem && (
              <View style={styles.reuseCardContainer}>
                <Text style={styles.reuseCardTitle}>💡 Reuse Ideas for {submittedItem}</Text>
                {loadingReuseIdeas && <ActivityIndicator size="small" color={COLORS.activityIndicatorColor} style={{ marginVertical: 10 }} />}
                {!loadingReuseIdeas && reuseIdeas.length > 0 && (
                  reuseIdeas.map((idea, index) => (
                    <Text key={index} style={styles.reuseIdeaText}>• {idea}</Text>
                  ))
                )}
                {!loadingReuseIdeas && reuseIdeas.length === 0 && submittedItem && (
                  <Text style={styles.noReuseIdeasText}>No specific reuse ideas found for this item. Get creative!</Text>
                )}
              </View>
            )}
          </View> 
          {/* End of cardsRowContainer */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: { // For ScrollView
    flexGrow: 1,
    justifyContent: 'center',
  },
  appContainer: { // This container wraps the row of cards
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'web' ? 10 : 10, // Adjusted padding
    backgroundColor: COLORS.background,
    width: '100%', // Ensure it takes full width for row layout
  },
  cardsRowContainer: { // New container for side-by-side layout
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center', // Align tops on web
    justifyContent: 'center', // Center the group of cards
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1000 : 500, // Max width for the row of cards on web
  },
  mainCard: { // Styles for the main card, previously 'card'
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? '58%' : '90%', // Adjust width for side-by-side
    maxWidth: Platform.OS === 'web' ? 500 : 500, // Max width for main card
    marginRight: Platform.OS === 'web' ? '2%' : 0, // Margin between cards on web
    marginBottom: Platform.OS === 'web' ? 0 : 20, // Margin below on mobile
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
    marginBottom: 10, // Reduced margin to accommodate fact
  },
  factText: { // Style for "Did you know?" facts
    fontSize: Platform.OS === 'web' ? 13 : 12,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  activityIndicator: {
    marginVertical: 20, // Give some space when loading
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
  outputBinInfo: { // This style might be deprecated if bin info is in raw_response
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: COLORS.secondaryText,
    marginBottom: 5,
  },
  outputTip: { // This style might be deprecated if tip is in raw_response
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },
  apiResponseHeader: {
    fontSize: Platform.OS === 'web' ? 16 : 15,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginTop: 10,
    marginBottom: 5,
  },
  apiResponseText: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: COLORS.secondaryText,
    lineHeight: 20,
  },
  outputCouncilInfo: {
    fontSize: Platform.OS === 'web' ? 17 : 15,
    color: COLORS.secondaryText, // Dimmer light text
    marginBottom: 5,
    fontWeight: '500',
  },
  councilGuideButton: { // Style for the council guide link/button
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle background
    borderRadius: 20,
    alignSelf: 'center', // Center the button
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  councilGuideButtonText: {
    color: COLORS.accentGreen, // Use accent color for the link text
    fontSize: Platform.OS === 'web' ? 14 : 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  stagedImageText: { // Style for the staged image indicator
    color: COLORS.placeholderTextColor,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  spacer: { // This spacer is inside the first card
    flex: 1,
    minHeight: 50, // Ensure some space even if output is small
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
  // Styles for Reuse Ideas Card
  reuseCardContainer: { // Renamed from reuseCard, and using common card styles + specific ones
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? '38%' : '90%', // Adjust width for side-by-side
    maxWidth: Platform.OS === 'web' ? 400 : 500,
    marginTop: Platform.OS === 'web' ? 0 : 20, // No top margin if side-by-side on web
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'web' ? 0.3 : 0.6,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    alignSelf: Platform.OS === 'web' ? 'flex-start' : 'center', // Align self for web row
  },
  reuseCardTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.accentGreen, // Use a distinct color, maybe accentGreen or primaryText
    textAlign: 'center',
    marginBottom: 15,
  },
  reuseIdeaText: {
    fontSize: Platform.OS === 'web' ? 15 : 14,
    color: COLORS.primaryText,
    marginBottom: 8,
    lineHeight: 20,
  },
  noReuseIdeasText: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: COLORS.secondaryText,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
});

export default App;
