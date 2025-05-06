import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Platform, Dimensions, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Color palette
const COLORS = {
  background: '#8132a8',
  cardBackground: '#FFFFFF',
  primaryText: '#333333',
  secondaryText: '#555555',
  accentGreen: '#2E7D32',
  recyclable: '#4CAF50',
  notRecyclable: '#D32F2F',
  inputBarBackground: '#E8EAF6',
  iconColor: '#3949AB',
  borderColor: '#CFD8DC',
  shadowColor: '#000',
};

const App = () => {
  const [inputValue, setInputValue] = useState('');
  const [submittedItem, setSubmittedItem] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isRecyclable, setIsRecyclable] = useState(null); // null, true, or false
  const [selectedImage, setSelectedImage] = useState(null);
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
      console.log("Selected image:", selectedImgUri);
      setSelectedImage(selectedImgUri);
      setSubmittedItem('Uploaded Image');
      setIsRecyclable(Math.random() > 0.5); // Dummy logic
      setShowOutput(true);
      setInputValue('');
    }
  };

  const handleSubmit = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    setLoading(true);
    setSubmittedItem(trimmedInput);
    setSelectedImage(null); // Clear image if typing
    setInputValue('');

    try {
      // Replace this with your actual API endpoint and logic
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
        <View style={styles.card}>
          <Text style={styles.headerText}>RecycleRight UK</Text>

          {loading && <ActivityIndicator size="large" color={COLORS.iconColor} style={{ marginBottom: 15 }} />}

          {showOutput && !loading && (
            <View style={styles.outputContainer}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 10 }}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.outputItemName}>{outputData.itemName}</Text>
              <Text style={[styles.outputStatus, { color: outputData.statusColor }]}>
                {outputData.status}
              </Text>
              <Text style={styles.outputBinInfo}>{outputData.binInfo}</Text>
              <Text style={styles.outputTip}>Tip: {outputData.tip}</Text>
            </View>
          )}

          <View style={styles.spacer} />

          <View style={styles.inputBar}>
            <TouchableOpacity onPress={handleImageUpload} style={styles.iconButton}>
              <Text style={styles.iconText}>📷</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type item or upload image..."
              placeholderTextColor={COLORS.secondaryText}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSubmit}
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? Math.min(screenWidth - 40, 500) : '90%',
    maxWidth: 500,
    minHeight: Platform.OS === 'web' ? 450 : '70%',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    display: 'flex',
    flexDirection: 'column',
  },
  headerText: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: 'bold',
    color: COLORS.accentGreen,
    textAlign: 'center',
    marginBottom: 25,
  },
  outputContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9F9F9',
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
    flex: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBarBackground,
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    marginTop: 'auto',
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
