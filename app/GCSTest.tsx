import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Linking, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import * as Location from 'expo-location';
import axios from 'axios';
import * as SMS from 'expo-sms';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';

export default function GCSTest() {
  const [eyeResponse, setEyeResponse] = useState(0);
  const [verbalResponse, setVerbalResponse] = useState(0);
  const [motorResponse, setMotorResponse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [hospitals, setHospitals] = useState([]);
  const pagerRef = useRef(null);
  const [isViewShotReady, setIsViewShotReady] = useState(false);
  const viewShotRef = useRef();
  const navigation = useNavigation();

  const handleNextPage = (responseSetter, value, nextPage) => {
    responseSetter(value);
    if (pagerRef.current) {
      pagerRef.current.setPage(nextPage);
    }
  };

  const calculateGCS = () => {
    return eyeResponse + verbalResponse + motorResponse;
  };

  const getDescription = (score) => {
    if (score >= 13) {
      return 'Mild: Minor brain injury. Monitoring and follow-up recommended.';
    } else if (score >= 9) {
      return 'Moderate: Moderate brain injury. Medical attention required.';
    } else {
      return 'Severe: Severe brain injury. Immediate medical attention required.';
    }
  };

  
  const shareResults = async () => {
    if (isViewShotReady) {
      try {
        const uri = await viewShotRef.current.capture();
        if (!(await Sharing.isAvailableAsync())) {
          alert("Sharing isn't available on your platform");
          return;
        }

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your GCS Score',
        });
      } catch (error) {
        console.error('Error sharing results:', error);
      }
    }
  };

  const resetAndNavigateToCamera = () => {
    // Reset all states
    setEyeResponse(0);
    setVerbalResponse(0);
    setMotorResponse(0);
    setLoading(false);
    setLoadingStep(0);
    setHospitals([]);

    // Go back to the first page
    if (pagerRef.current) {
      pagerRef.current.setPage(0);
    }

    // Navigate to the camera page
    navigation.navigate('camera');
  };

  const alertFamilyMembers = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync(
        [],
        `My GCS Score is ${gcsScore}. ${getDescription(gcsScore)}. Please check on me.`
      );
      console.log(result);
    } else {
      console.log('SMS is not available on this device');
    }
  };


  const fetchHospitals = async (location) => {
    const { latitude, longitude } = location.coords;
    
    try {
      // First, let's get the city name using reverse geocoding
      const geocodeResponse = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      
      const city = geocodeResponse.data.address.city || 
                   geocodeResponse.data.address.town ||
                   geocodeResponse.data.address.village ||
                   'Unknown';
  
      // Now, let's query for hospitals using Overpass API
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:10000,${latitude},${longitude});
          way["amenity"="hospital"](around:10000,${latitude},${longitude});
          relation["amenity"="hospital"](around:10000,${latitude},${longitude});
        );
        out center;
      `;
      
      const overpassResponse = await axios.post('https://overpass-api.de/api/interpreter', query);
  
      const hospitals = overpassResponse.data.elements.map((element) => {
        const hospitalLat = element.lat || element.center.lat;
        const hospitalLon = element.lon || element.center.lon;
        
        // Calculate distance using Haversine formula
        const R = 6371; // Radius of the Earth in km
        const dLat = (hospitalLat - latitude) * (Math.PI / 180);
        const dLon = (hospitalLon - longitude) * (Math.PI / 180);
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(latitude * (Math.PI / 180)) * Math.cos(hospitalLat * (Math.PI / 180)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
  
        return {
          name: element.tags.name || 'Unnamed Hospital',
          distance: `${distance.toFixed(2)} km`,
        };
      });
  
      setHospitals(hospitals);
      console.log(`Found ${hospitals.length} hospitals near ${city}`);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);  // Set empty array in case of error
    }
  };

  const openMaps = (name, lat, lon) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    const label = name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setLoadingStep(0);

    let step = 0;
    const interval = setInterval(async () => {
      step += 1;
      setLoadingStep(step);

      if (step === 2) {
        // Get user location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        fetchHospitals(location);
      }

      if (step === 4) {
        clearInterval(interval);
        setLoading(false);
        if (pagerRef.current) {
          pagerRef.current.setPage(4);
        }
      }
    }, 500);
  };

  const gcsScore = calculateGCS();

  return (
    <View style={styles.container}>
      <PagerView ref={pagerRef} style={styles.pagerView} initialPage={0} scrollEnabled={!loading}>
        <View key="1" style={styles.page}>
        
          <Text style={styles.title}>Based On The Previous Eye Response Scan:</Text>
          <Text style={styles.subtitle}>Choose which you feel apply.</Text>
          <TouchableOpacity 
            style={[styles.option, eyeResponse === 1 && styles.selectedOption]} 
            onPress={() => handleNextPage(setEyeResponse, 1, 1)}
          >
            <Text style={[styles.optionText, eyeResponse === 1 && styles.selectedOptionText]}>No Eye Opening</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.option, eyeResponse === 2 && styles.selectedOption]} 
            onPress={() => handleNextPage(setEyeResponse, 2, 1)}
          >
            <Text style={[styles.optionText, eyeResponse === 2 && styles.selectedOptionText]}>Eye Opening To Pain</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.option, eyeResponse === 3 && styles.selectedOption]} 
            onPress={() => handleNextPage(setEyeResponse, 3, 1)}
          >
            <Text style={[styles.optionText, eyeResponse === 3 && styles.selectedOptionText]}>Eyes Open Spontaneously</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.option, eyeResponse === 4 && styles.selectedOption]} 
            onPress={() => handleNextPage(setEyeResponse, 4, 1)}
          >
            <Text style={[styles.optionText, eyeResponse === 4 && styles.selectedOptionText]}>Eye Opening To Verbal Command</Text>
          </TouchableOpacity>
          <Image
              source={require('../assets/images/neuro.png')}
              style={styles.botImageChat}
            />
        </View>

        <View key="2" style={styles.page}>
          <Text style={styles.title}>Verbal Response</Text>
          <Text style={styles.subtitle}>Choose which apply.</Text>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity 
              key={value}
              style={[styles.option, verbalResponse === value && styles.selectedOption]} 
              onPress={() => handleNextPage(setVerbalResponse, value, 2)}
            >
              <Text style={[styles.optionText, verbalResponse === value && styles.selectedOptionText]}>
                {['No Verbal Response', 'Incomprehensible Sounds', 'Inappropriate Words', 'Confused', 'Oriented'][value - 1]} ({value})
              </Text>
            </TouchableOpacity>
          ))}
          <Image
              source={require('../assets/images/neuro.png')}
              style={styles.botImageChat}
            />
        </View>

        <View key="3" style={styles.page}>
          <Text style={styles.title}>Motor Response</Text>
          <Text style={styles.subtitle}>Choose which apply.</Text>
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <TouchableOpacity 
              key={value}
              style={[styles.option, motorResponse === value && styles.selectedOption]} 
              onPress={() => handleNextPage(setMotorResponse, value, 3)}
            >
              <Text style={[styles.optionText, motorResponse === value && styles.selectedOptionText]}>
                {['No Motor Response', 'Extension to Pain', 'Flexion to Pain', 'Withdrawal from Pain', 'Localizes Pain', 'Obeys Commands'][value - 1]} ({value})
              </Text>
            </TouchableOpacity>
          ))}
          <Image
              source={require('../assets/images/neuro.png')}
              style={styles.botImageChat}
            />
        </View>

        <View key="4" style={styles.page}>
          <Image
            source={require('../assets/images/neuro.png')}
            style={styles.botImageChat}
          />
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>
                {['Calculating results...', 'Applying Glasgow Formula...', 'Finding next steps...', 'Locating hospitals around you...'][loadingStep]}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>
                Are you ready for your results?
              </Text>
              <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
                <Text style={styles.calculateButtonText}>Show Results</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <ViewShot key="5" ref={viewShotRef} onLayout={() => setIsViewShotReady(true)} style={styles.page}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>GCS Score</Text>
            <Text style={styles.subtitle}>Your Glasgow Coma Scale (GCS) Score is:</Text>
            <Text style={styles.gcsScore}>{gcsScore}</Text>
            <Text style={styles.description}>{getDescription(gcsScore)}</Text>
            <Text style={styles.nextSteps}>
              Please consult a healthcare professional for further assessment and guidance.
            </Text>
            <View style={styles.hospitalList}>
              <Text style={styles.hospitalListTitle}>Nearby Hospitals:</Text>
              {hospitals.map((hospital, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.hospitalItem}
                  onPress={() => openMaps(hospital.name, hospital.lat, hospital.lon)}
                >
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  <Text style={styles.hospitalDistance}>{hospital.distance}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={shareResults}>
              <Text style={styles.buttonText}>Share Results</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={alertFamilyMembers}>
              <Text style={styles.buttonText}>Alert Family Members</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={resetAndNavigateToCamera}>
              <Text style={styles.buttonText}>New Assessment</Text>
            </TouchableOpacity>
          </View>
        </ViewShot>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  option: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '80%',
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gcsScore: {
    fontSize: 60,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#007AFF',
  },
  description: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  nextSteps: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  hospitalList: {
    width: '100%',
    marginTop: 20,
  },
  hospitalListTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  hospitalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  hospitalName: {
    flex: 1,
    fontSize: 18,
    color: '#007AFF',
  },
  hospitalDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  botImageChat: {
    width: 50,
    height: 50,
    marginVertical: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingVertical: 20,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});