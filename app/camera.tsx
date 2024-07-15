import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';

export default function CameraScreen() {
  const [isEyesClosed, setIsEyesClosed] = useState(false);
  const device = useCameraDevice('front');
  const { hasPermission } = useCameraPermission();
  const navigation = useNavigation();

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No camera device available.</Text>
      </View>
    );
  }

  const handleContinue = () => {
    if (isEyesClosed) {
      navigation.navigate('GCSTest');
      setIsEyesClosed(false);
    } else {
      setIsEyesClosed(true);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>{isEyesClosed ? 'Close Your Eyes' : 'Open Your Eyes'}</Text>
        <View style={[styles.circle, { borderColor: isEyesClosed ? '#00FF00' : '#007AFF' }]}>
         
        </View>
        <Text style={styles.instruction}>
          {isEyesClosed
            ? 'Close your eyes and place your face in the circle, then press continue.'
            : 'Open your eyes and place your face in the circle, then press continue.'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {isEyesClosed ? 'Yes, I closed my eyes' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    color: '#333',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  circle: {
    width: 350,
    height: 400,
    borderRadius: 200,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  instruction: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
});