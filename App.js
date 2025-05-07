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
  // New state variables for the new API response structure
  const [binColor, setBinColor] = useState('');
  const [tip, setTip] = useState('');
  const [councilLink, setCouncilLink] = useState('');
  const [apiAnswer, setApiAnswer] = useState(''); // To store the detailed answer
  const [showMoreInfo, setShowMoreInfo] = useState(false); // To toggle detailed answer visibility
  // apiRawResponse and apiReason might be deprecated by the new structure, let's clear them
  // const [apiRawResponse, setApiRawResponse] = useState(''); 
  // const [apiReason, setApiReason] = useState(''); 

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

  const clearBackendHistory = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/clear', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          // 'Content-Type': 'application/json' // Not strictly needed for an empty body POST
        },
        body: '' // Empty body as per curl example
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to clear backend history:', response.status, errorText);
        // Optionally, inform the user or handle differently
      } else {
        const result = await response.json();
        console.log('Backend history clear response:', result);
      }
    } catch (error) {
      console.error('Error clearing backend history:', error);
    }
  };

  const handleSubmit = async () => {
    // await clearBackendHistory(); // Call clear history at the beginning

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

      const response = await fetch('http://127.0.0.1:8000/analyze/image', {
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

      // Update state based on the new API response structure
      if (data.recyclable && data.recyclable.toLowerCase() === "yes") {
        setIsRecyclable(true);
      } else if (data.recyclable && data.recyclable.toLowerCase() === "no") {
        setIsRecyclable(false);
      } else {
        setIsRecyclable(null); // For "Maybe" or other non-binary responses
      }
      setBinColor(data.bin_color || '');
      setTip(data.tip || '');
      setApiAnswer(data.answer || '');
      setCouncilLink(data.council_link || '');
      // Clear old state if they are no longer used by the new API structure
      // setApiRawResponse(''); // Deprecated by data.answer
      // setApiReason(''); // Deprecated if not present in new API

      setShowOutput(true);
      setShowMoreInfo(false); // Reset more info view on new submission
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % RECYCLING_FACTS.length);
      
      // Revert to sending currentSubmittedItemName to GPT, as data.answer might be too verbose
      fetchReuseIdeasFromGPT(currentSubmittedItemName);

    } catch (error) {
      console.error("Error submitting to local API:", error);
      // Clear all relevant output states on error
      setIsRecyclable(null);
      setBinColor('');
      setTip('');
      setApiAnswer(`Error: ${error.message}`);
      setCouncilLink('');
      setShowOutput(true); // Still show output card to display the error message
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

    const prompt = `Give me one practical and one creative reuse or upcycling ideas for this item: "${itemName}".
     Keep them short and useful. 

     Output:
     Practical suggestion: ...
     Creative suggestion: ...
     `;
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
    const linkToOpen = councilLink || `https://www.google.com/search?q=recycling+guide+${submittedPostcode ? `Council for ${submittedPostcode}` : "My Council"}`;
    console.log(`Clicked council guide link. Opening: ${linkToOpen}`);
    Linking.canOpenURL(linkToOpen).then(supported => {
      if (supported) {
        Linking.openURL(linkToOpen);
      } else {
        console.log("Don't know how to open URI: " + linkToOpen);
        // Fallback or alert if Linking fails for some reason
        alert(`Could not open the link: ${linkToOpen}`);
      }
    }).catch(err => console.error('An error occurred opening the link', err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.appContainer}>
          <View style={styles.cardsRowContainer}>
            {/* Main Input Card */}
            <View style={styles.mainCard}>
              <Text style={styles.headerText}>RecycleRight UK</Text>
              <Text style={styles.factText}>Did you know? {RECYCLING_FACTS[currentFactIndex]}</Text>

              {/* Display submitted item name and image here if desired */}
              {submittedItem && !loading && showOutput && ( // Show only after a submission that sets submittedItem
                <View style={styles.submittedItemPreview}>
                  {submittedImageDisplayUri && (
                    <Image
                      source={{ uri: submittedImageDisplayUri }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.previewItemName}>{submittedItem}</Text>
                </View>
              )}
              
              {loading && <ActivityIndicator size="large" color={COLORS.activityIndicatorColor} style={styles.activityIndicator} />}
              
              <View style={styles.spacer} /> {/* Pushes inputs to bottom */}

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
            {/* End of Main Input Card View */}

            {/* Recycling Details Card - New Card */}
            {showOutput && !loading && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsCardTitle}>Recycling Details</Text>
                {/* Displaying Recyclability Status based on API */}
                <Text style={[
                  styles.outputStatus,
                  { color: isRecyclable === true ? COLORS.recyclable : isRecyclable === false ? COLORS.notRecyclable : COLORS.secondaryText }
                ]}>
                  {isRecyclable === true ? "YES - Recyclable" : isRecyclable === false ? "NO - Not Recyclable" : "Status: Check Details"}
                </Text>

                {binColor && <Text style={styles.detailText}><Text style={styles.detailLabel}>Bin:</Text> {binColor}</Text>}
                {tip && <Text style={styles.detailText}><Text style={styles.detailLabel}>Tip:</Text> {tip}</Text>}
                
                {(councilLink || submittedPostcode) && (
                  <TouchableOpacity onPress={handleCouncilGuideLink} style={styles.councilGuideButton}>
                    <Text style={styles.councilGuideButtonText}>
                      {councilLink ? "View Council Guide" : `Search for ${submittedPostcode ? `Council for ${submittedPostcode}` : "My Council"} Guide`}
                    </Text>
                  </TouchableOpacity>
                )}

                {apiAnswer && (
                  <TouchableOpacity onPress={() => setShowMoreInfo(!showMoreInfo)} style={styles.moreInfoButton}>
                    <Text style={styles.moreInfoButtonText}>{showMoreInfo ? "Hide Details" : "More Info"}</Text>
                  </TouchableOpacity>
                )}

                {showMoreInfo && apiAnswer && (
                  <View style={styles.moreInfoContainer}>
                    <Text style={styles.apiResponseHeader}>Detailed Information:</Text>
                    <Text style={styles.apiResponseText}>{apiAnswer}</Text>
                  </View>
                )}
              </View>
            )}
            {/* End of Recycling Details Card */}

            {/* Reuse Ideas Card - Conditionally rendered */}
            {showOutput && !loading && submittedItem && ( // Ensure it only shows when there's an item and output is ready
              <View style={styles.reuseCardContainer}>
                <Text style={styles.reuseCardTitle}>💡 Reuse Ideas</Text>
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
  mainCard: { // Styles for the main input card
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? '35%' : '90%', // Adjust width for 3 columns
    maxWidth: Platform.OS === 'web' ? 350 : 500, 
    marginRight: Platform.OS === 'web' ? '2%' : 0, 
    marginBottom: Platform.OS === 'web' ? 0 : 20, 
    minHeight: Platform.OS === 'web' ? 450 : 'auto', // Ensure it has some height
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
  submittedItemPreview: { // Styles for the preview in the main card
    alignItems: 'center',
    marginBottom: 15,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
  },
  previewItemName: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: COLORS.primaryText,
    fontWeight: '600',
  },
  activityIndicator: {
    marginVertical: 20, // Give some space when loading
  },
  // outputContainer is effectively replaced by detailsCard styles
  detailsCard: { // Styles for the new Recycling Details Card
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? '32%' : '90%', // Adjust width
    maxWidth: Platform.OS === 'web' ? 350 : 500,
    marginRight: Platform.OS === 'web' ? '2%' : 0,
    marginBottom: Platform.OS === 'web' ? 0 : 20,
    minHeight: Platform.OS === 'web' ? 450 : 'auto',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'web' ? 0.3 : 0.6,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    display: 'flex',
    flexDirection: 'column',
  },
  detailsCardTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.accentGreen,
    textAlign: 'center',
    marginBottom: 15,
  },
  uploadedImage: { // Style for the uploaded image (can be reused if needed in details card, but currently in main)
    width: '100%',
    height: 150, // Adjusted for preview
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  outputItemName: { // For item name in details card if needed, or reuse for submittedItem in main card
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 8,
    textAlign: 'center',
  },
  outputStatus: { // For status in details card
    fontSize: Platform.OS === 'web' ? 22 : 20,
    fontWeight: 'bold',
    marginBottom: 10, // Increased margin
    textAlign: 'center',
  },
  detailLabel: { // Style for labels like "Bin:", "Tip:"
    fontWeight: 'bold',
    color: COLORS.primaryText,
  },
  detailText: { // Style for the text next to labels
    fontSize: Platform.OS === 'web' ? 16 : 15,
    color: COLORS.secondaryText,
    marginBottom: 8,
    lineHeight: 22,
  },
  // outputBinInfo and outputTip styles are effectively replaced by detailText with labels
  apiResponseHeader: { // For "Detailed Information:" header
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
  moreInfoButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Even more subtle
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  moreInfoButtonText: {
    color: COLORS.secondaryText,
    fontSize: Platform.OS === 'web' ? 13 : 12,
    textAlign: 'center',
  },
  moreInfoContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.borderColor,
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
  reuseCardContainer: { 
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? '32%' : '90%', // Adjust width for 3 columns
    maxWidth: Platform.OS === 'web' ? 350 : 500,
    marginTop: Platform.OS === 'web' ? 0 : 20, 
    minHeight: Platform.OS === 'web' ? 450 : 'auto', // Ensure consistent height with other cards in row
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
