import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCameraPermission } from 'react-native-vision-camera';

export default function Welcome() {
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    const requestCameraPermission = async () => {
      await requestPermission();
    };

    requestCameraPermission();
  }, []);

  const handleContinue = () => {
    if (hasPermission) {
      router.push('/EyeResponseScan');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Image source={require('../assets/images/cam.png')} style={styles.icon} />
      </View>
      <Text style={styles.title}>ALLOW CAMERA</Text>
      <Text style={styles.subtitle}>
        This allows the app to access your camera, so you can take the TBI visual portion of the brain injury test.
      </Text>
      <TouchableOpacity style={styles.allowButton} onPress={handleContinue}>
        <Text style={styles.allowButtonText}>Allow</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.denyButton} onPress={() => {}}>
        <Text style={styles.denyButtonText}>Don't Allow</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    height: 200,
    width: 300,
    resizeMode: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  allowButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  allowButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  denyButton: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007AFF',
    width: '80%',
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
