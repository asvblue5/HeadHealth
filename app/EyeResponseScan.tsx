import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const EyeResponseScan = () => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [askingFor, setAskingFor] = useState('name');
  const [currentTypingMessage, setCurrentTypingMessage] = useState('');
  const navigation = useNavigation();
  const scrollViewRef = useRef();

  const typeMessage = (message) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setCurrentTypingMessage((prev) => prev + message[i]);
        i++;
      } else {
        clearInterval(interval);
        setMessages(prev => [...prev, { text: message, sender: 'bot' }]);
        setCurrentTypingMessage('');
      }
    }, 50);
  };

  const handleTakeExam = () => {
    setShowChat(true);
    typeMessage("Hi there! What's your name?");
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');

    if (askingFor === 'name') {
      setTimeout(() => {
        typeMessage(`Nice to meet you, ${inputText}! How old are you?`);
        setAskingFor('age');
      }, 500);
    } else if (askingFor === 'age') {
      setTimeout(() => {
        typeMessage(`Great! You're ${inputText} years old. Let's start the exam.`);
        setTimeout(() => {
          navigation.navigate('camera');
        }, 1500);
      }, 500);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, currentTypingMessage]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {!showChat ? (
          <View style={styles.content}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.titleText}>
              <Text style={styles.blueText}>Head Health</Text> - your AI
            </Text>
            <Text style={styles.titleText}>Traumatic Brain Injury Assistant</Text>
   
            <Image
              source={require('../assets/images/neuro.png')}
              style={styles.botImage}
            />
            
            <TouchableOpacity style={styles.examButton}>
              <Text style={styles.examButtonText}>Learn about TBI's</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.examButton}>
              <Text style={styles.examButtonText}>Road To Recovery Games</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.queryButton} onPress={handleTakeExam}>
              <Text style={styles.queryButtonText}>Take the exam</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chatContainer}>
            <Image
              source={require('../assets/images/neuro.png')}
              style={styles.botImageChat}
            />
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContentContainer}
            >
              {messages.map((message, index) => (
                <View key={index} style={[styles.messageBubble, message.sender === 'bot' ? styles.botBubble : styles.userBubble]}>
                  <View style={[styles.textBubble, message.sender === 'bot' ? styles.botTextBubble : styles.userTextBubble]}>
                    <Text style={[styles.messageText, message.sender === 'user' && styles.userMessageText]}>{message.text}</Text>
                  </View>
                </View>
              ))}
              {currentTypingMessage && (
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <View style={[styles.textBubble, styles.botTextBubble]}>
                    <Text style={styles.messageText}>{currentTypingMessage}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  blueText: {
    color: '#007AFF',
  },
  botImage: {
    width: 120,
    height: 120,
    marginVertical: 30,
  },
  botImageChat: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginTop: 20,
  },
  examButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  examButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  queryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    width: '100%',
  },
  queryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 10,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  botBubble: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  textBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
  },
  botTextBubble: {
    backgroundColor: '#F0F0F0',
  },
  userTextBubble: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default EyeResponseScan;