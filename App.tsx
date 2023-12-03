/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useRef, useEffect} from 'react';
import type {PropsWithChildren} from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Animated,
  View,
  AppState,
  Dimensions,
  Easing,
  AppStateStatus,
  DimensionValue,
  Modal,
  TextInput,
  ToastAndroid,
  Pressable,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth: DimensionValue = Dimensions.get('screen').width;
const screenHeight: DimensionValue = Dimensions.get('screen').height;

function App(): JSX.Element {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [VisibleAppState, setVisibleAppState] = useState(appState.current);
  const [temperature, setTemperature] = useState<number>(0);
  const [updateDate, setUpdateDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scaleOnPressValue = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const [isVisibleModal, setIsVisibleModal] = useState<boolean>(false);
  const [serverAddress, setServerAddress] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(true);

  const AnimatedIcon = Animated.createAnimatedComponent(Icon);

  type serverData = {
    serverAddress: string;
    token: string;
  };

  useEffect(() => {
    handleReload();

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const spinner = Animated.loop(
    Animated.timing(spinValue, {
      toValue: 2,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = Animated.loop(
    Animated.timing(scaleAnim, {
      toValue: 1.1,
      duration: 50000,
      easing: Easing.elastic(100),
      useNativeDriver: true,
    }),
  );

  const scaleOnPress = Animated.loop(
    Animated.timing(scaleOnPressValue, {
      toValue: 1.2,
      duration: 50000,
      easing: Easing.elastic(100),
      useNativeDriver: true,
    }),
  );

  function handleAppStateChange(nextState: String) {
    if (nextState === 'active') {
      handleReload();
    }
  }
  useEffect(() => {
    scale.reset();
    spinner.reset();
  }, [updateDate]);

  async function handleReload() {
    //setRefreshing(true);
    await getStoredData();
    getData();

    //setRefreshing(false);
  }
  async function getData() {
    scale.start();
    spinner.start();

    try {
      const response = await fetch(
        `http://${serverAddress}/temperature?token=${token}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status == 401) {
        console.log('OCORREU UM ERRO: ', response);

        throw new Error('Token inválido!');
      }

      const {temp} = await response.json();

      setTemperature(temp.toFixed(2));
      setUpdateDate(new Date());
    } catch (error) {
      console.log('Ocorreu um erro ao obter os dados', error);
      tostMessage(`${error}`);
    }
  }

  async function storeData(value: serverData) {
    try {
      await AsyncStorage.setItem('server-address', JSON.stringify(value));

      tostMessage('Dados salvos com sucesso!');
    } catch (e) {
      // saving error
      console.log('Ocorreu um erro ao salvar os dados', e);
      tostMessage(`Não foi possível salvar os dados!: ${e}`);
    }
  }

  async function getStoredData() {
    try {
      const value = await AsyncStorage.getItem('server-address');
      if (value !== null) {
        const data: serverData = await JSON.parse(value);

        // value previously stored
        setServerAddress(data.serverAddress);
        setToken(data.token);
        return value;
      }
    } catch (e) {
      // error reading value
      console.log('Ocorreu um erro ao obter os dados', e);
    }
  }

  function tostMessage(message: string) {
    ToastAndroid.showWithGravityAndOffset(
      message,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
      0,
      0,
    );
  }

  const isDarkMode = true;
  //const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : '#FFF9',
  };
  const textColor = {
    colorTitle: isDarkMode ? '#FFF9' : '#000',
    colorData: isDarkMode ? '#DD5B07' : '#E9FF33',
  };

  return (
    <View style={styles.container}>
      <Modal visible={isVisibleModal}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backgroundStyle.backgroundColor,
          }}>
          <AnimatedIcon
            name="close-circle"
            color="#FFF9"
            size={42}
            style={{transform: [{scale: scaleOnPressValue}]}}
            onPress={() => setIsVisibleModal(false)}
            onPressIn={() => scaleOnPress.start()}
            onPressOut={() => scaleOnPress.reset()}
          />

          <TextInput
            style={{
              padding: 2,
              backgroundColor: '#FFF9',
              height: 40,
              width: Dimensions.get('window').width - 30,
              borderRadius: 5,
              marginTop: 10,
              marginBottom: 5,
              fontSize: 18,
            }}
            placeholder="Server address..."
            placeholderTextColor="#FFF6"
            value={serverAddress}
            onChangeText={text => setServerAddress(text)}
            autoCapitalize="none"
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFF9',
              borderRadius: 5,
              marginBottom: 5,
              width: Dimensions.get('window').width - 30,
              height: 40,
            }}>
            <TextInput
              style={{
                padding: 2,
                //backgroundColor: '#FFF9',
                height: 40,
                width: Dimensions.get('window').width - 50,
                //borderRadius: 5,
                //marginBottom: 5,
                fontSize: 18,
              }}
              placeholder="Token..."
              placeholderTextColor="#FFF6"
              value={token}
              onChangeText={text => setToken(text)}
              secureTextEntry={passwordVisible}
              autoCapitalize="none"
            />

            <AnimatedIcon
              name={passwordVisible ? 'eye' : 'eye-off'}
              onPress={() => setPasswordVisible(!passwordVisible)}
              size={20}
              color={'#232323'}
              style={{}}
            />
          </View>

          <AnimatedIcon
            name="content-save-all"
            color="#2194A4"
            size={42}
            onPress={() => storeData({serverAddress, token})}
          />
        </View>
      </Modal>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleReload} />
        }
        style={backgroundStyle}
        contentContainerStyle={styles.scrollview}>
        <AnimatedIcon
          name="cog"
          size={22}
          color={textColor.colorTitle}
          style={{margin: 10, transform: [{scale: scaleOnPressValue}]}}
          onPress={() => setIsVisibleModal(true)}
          onPressIn={() => scaleOnPress.start()}
          onPressOut={() => scaleOnPress.reset()}
        />

        <Text style={[styles.textTitle, {color: textColor.colorTitle}]}>
          CPU Raspberry PI
        </Text>
        <Text style={[styles.textTitle, {color: textColor.colorTitle}]}>
          Temp:
        </Text>
        <Animated.Text
          style={[
            styles.textData,
            {color: textColor.colorData, transform: [{scale: scaleAnim}]},
          ]}>
          {temperature}°C
        </Animated.Text>

        <AnimatedIcon
          name="reload"
          color="green"
          size={52}
          onPress={handleReload}
          style={{transform: [{rotate: spin}]}}
          onPressIn={() => spinner.start()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
  },
  textTitle: {
    fontSize: 18,
    fontFamily: 'Arial',
  },
  textData: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
});

export default App;
