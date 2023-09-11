import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View, TextInput, SafeAreaView, useColorScheme, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts, Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/Octicons';

export default function App() {
  // useEffect(() => {
  //   axios.get('https://gyphxndwr5.execute-api.us-east-1.amazonaws.com/dev/ecampus')
  //     .then((response) => {
  //       setRes(response?.data?.body?.output);
  //     }
  //   );
  // }, []);

  let [fontsLoaded] = useFonts({
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = `${isDark ? 'black' : 'white'}`
  const textColor = `${isDark ? 'white' : 'black'}`
  const cardBgColor = `${isDark ? 'lightsteelblue' : '#203C5B'}`
  const cardTextColor = `${isDark ? 'black' : 'white'}`

  const barColor = (value) => {
    return value > 75 ? isDark ? 'green' : '#46E44F' : isDark ? 'firebrick' : '#FF666B';
  }

  const exeBarColor = (value) => {
    return value > 75 ? '#35A63C' : 'crimson';
  }

  const medExeBarColor = (value) => {
    return value > 75 ? '#26752B' : 'maroon';
  }

  const getAttendance = async () => {
    console.log('getAttendance', username, password);

    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }
    setLoading(true);
    const response = await axios.post('https://lqr530zc31.execute-api.ap-south-1.amazonaws.com/dev/ecampusScrape',
      {
        "body": {
          "username": username,
          "password": password
        }
      });

    setLoading(false);
    if (response?.data?.statusCode === 200) {
      setStudentName(response?.data?.body?.studentName);
      setAttendance(response?.data?.body?.attendance);
      setCourses(JsonCourses(response?.data?.body?.courses));
      setSemResults(response?.data?.body?.results);
      calculateGPA(response?.data?.body?.results);
      // console.log(response?.data?.body);
    } else {
      setStudentName(null);
      setAttendance(null);
      setCourses(null);
      setSemResults(null);
      alert('Invalid username or password');
    }

    const val = response?.data?.body?.attendance;
    setLastUpdated({
      date: val[1][val[1]?.length - 1].split('-')[0],
      month: months[val[1][val[1]?.length - 1].split('-')[1] - 1],
      year: val[1][val[1]?.length - 1].split('-')[2]
    });

    AsyncStorage.setItem('retrievedData', JSON.stringify(response?.data?.body));
  }

  useEffect(() => {
    AsyncStorage.getItem('retrievedData').then((value) => {
      // console.log("Loaded from cache", value);
      const resp = JSON.parse(value);
      const att = resp?.attendance;
      setAttendance(att);
      setCourses(JsonCourses(resp?.courses));
      setStudentName(resp?.studentName);
      setSemResults(resp?.results);
      calculateGPA(resp?.results);

      setLastUpdated({
        date: att[1][att[1]?.length - 1].split('-')[0],
        month: months[att[1][att[1]?.length - 1].split('-')[1] - 1],
        year: att[1][att[1]?.length - 1].split('-')[2]
      });
    });
  }, []);

  const calculateGPA = (results) => {
    var grades = 0, credits = 0;
    results.map((item) => {
      const exp = item[3] * item[4].split(' ')[0];
      grades += isNaN(exp) ? 0 : exp;
      credits += parseInt(item[3]);
    });
    setGpa((grades / credits).toFixed(2));
  }

  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState(null);

  const [studentName, setStudentName] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [courses, setCourses] = useState(null);
  const [semResults, setSemResults] = useState(null);
  const [gpa, setGpa] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gridView, setGridView] = useState(false);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Dec']

  String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
  };

  const JsonCourses = (course) => {
    c = {}
    course.map((item) => {
      c[item[0]] = item[1];
    })
    return c;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView style={{
        paddingVertical: 64,
        paddingHorizontal: 16,
        flex: 1,
        backgroundColor: bgColor,
      }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          flex: 1,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 80,
        }}>
          <StatusBar style={`${isDark ? 'light' : 'dark'}`} />
          <Text style={{ fontSize: 42, fontWeight: '500', color: textColor, fontFamily: 'Manrope_400Regular' }}>Attendance</Text>

          <TextInput style={{ backgroundColor: 'lightgrey', padding: 12, borderRadius: 12, marginTop: 24, width: '95%', fontSize: 16 }} placeholder="Username" placeholderTextColor={'gray'}
            onChangeText={text => setUsername(text)}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, width: '95%' }}>
            <TextInput style={{ backgroundColor: 'lightgrey', padding: 12, borderRadius: 12, width: '60%', fontSize: 16 }} placeholder="Password" placeholderTextColor={'gray'}
              onChangeText={text => setPassword(text)}
            />
            <TouchableOpacity onPress={getAttendance} style={{ backgroundColor: 'teal', borderRadius: 12, padding: 12, width: '38%', justifyContent: 'center' }}><Text style={{ color: 'white', fontFamily: 'Manrope_600SemiBold', textAlign: 'center', fontSize: 16 }}>Fetch</Text></TouchableOpacity>
          </View>


          {(courses && attendance && !loading) ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 8, width: '100%' }}>
              <Text style={{ fontSize: 36, color: textColor, fontFamily: 'Manrope_400Regular', marginTop: 36, paddingLeft: 12, textAlign: 'left', width: '100%' }}>Hello, {studentName?.split(' ')[0]?.toTitleCase()}</Text>

              <View style={{ flexDirection: 'row', gap: 14, marginTop: 24, width: '90%', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 200, color: textColor, width: '30%', fontFamily: 'Manrope_200ExtraLight' }}>Last Updated</Text>
                <View style={{ flexDirection: 'row', gap: 8, width: '70%', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 20 }}>
                  <Text style={{ fontSize: 80, fontWeight: 600, color: textColor, fontFamily: 'Manrope_700Bold' }}>{lastUpdated?.date}</Text>
                  <View style={{ flexDirection: 'column', gap: -4 }}>
                    <Text style={{ fontWeight: 500, fontSize: 28, color: textColor, fontFamily: 'Manrope_600SemiBold' }}>{lastUpdated?.month}</Text>
                    <Text style={{ fontWeight: 500, fontSize: 28, color: textColor, fontFamily: 'Manrope_600SemiBold' }}>{lastUpdated?.year}</Text>
                  </View>
                </View>
              </View>

              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: -10 }}>
                  <Icon2.Button name="rows" size={24} color={`${gridView ? 'gray' : textColor}`} backgroundColor={bgColor} onPress={() => { setGridView(false) }} />
                  <Icon.Button name="grid-outline" size={24} color={`${!gridView ? 'gray' : textColor}`} backgroundColor={bgColor} onPress={() => { setGridView(true) }} />
                </View>
              </View>

              <View style={{ gap: 12, paddingTop: 24, flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'center' }}>
                {(Object.keys(attendance))?.sort((a, b) => parseInt(attendance[a][5]) > parseInt(attendance[b][5]) ? 1 : -1)
                  .map((item) => {

                    const percentage = attendance[item][5];
                    const exePercentage = attendance[item][6];
                    const medExePercentage = attendance[item][7];

                    return (
                      <View key={item} style={{ backgroundColor: cardBgColor, padding: 20, borderRadius: 16, width: `${gridView ? '48%' : '96%'}`, gap: 2 }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Manrope_300Light', color: cardTextColor }}>{attendance[item][0]}</Text>
                        <Text style={{ fontSize: 20, fontFamily: 'Manrope_600SemiBold', color: cardTextColor }}>{courses[attendance[item][0]]?.toTitleCase()}</Text>
                        <View style={{ flex: 1 }} />

                        <View style={{ position: 'relative' }}>
                          <View style={{ backgroundColor: medExeBarColor(medExePercentage), width: `${medExePercentage}%`, borderRadius: 12, padding: 10, marginTop: 12, position: 'absolute' }}>
                            <Text style={{ fontSize: 16, color: 'white', fontFamily: 'Manrope_500Medium' }}>{medExePercentage}%</Text>
                          </View>

                          <View style={{ backgroundColor: exeBarColor(exePercentage), width: `${exePercentage}%`, borderRadius: 12, padding: 10, marginTop: 12, position: 'absolute' }}>
                            <Text style={{ fontSize: 16, color: 'white', fontFamily: 'Manrope_500Medium' }}>{exePercentage}%</Text>
                          </View>

                          <View style={{ backgroundColor: barColor(percentage), width: `${percentage}%`, borderRadius: 12, padding: 10, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                            {!gridView && (
                              <Text style={{ fontSize: 16, color: textColor, fontFamily: 'Manrope_500Medium' }}>{attendance[item][4]} / {attendance[item][1]}</Text>
                            )}
                            <View style={{ flexDirection: 'row' }}>
                              <Text style={{ fontSize: 16, color: textColor, fontFamily: 'Manrope_500Medium' }}>{percentage}%</Text>
                              {!gridView && attendance[item][2] !== '0' && (
                                <Text style={{ fontSize: 16, color: textColor, fontFamily: 'Manrope_500Medium' }}>  •  {exePercentage}%</Text>
                              )}
                              {!gridView && exePercentage !== medExePercentage && (
                                <Text style={{ fontSize: 16, color: textColor, fontFamily: 'Manrope_500Medium' }}>  •  {medExePercentage}%</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    )
                  }
                  )}
              </View>
            </View>
          ) : loading && (
            <Text style={{ color: textColor, fontFamily: 'Manrope_500Medium', fontSize: 18, marginTop: 24 }}>Loading...</Text>
          )}

          {semResults && (
            <View style={{ width: '100%', padding: 12, gap: 12 }}>
              <Text style={{ fontSize: 42, fontWeight: '500', color: textColor, fontFamily: 'Manrope_400Regular' }}>Sem {semResults[0][0]} Results</Text>
              {semResults.map((item, index) => (
                <View key={index} style={{ backgroundColor: cardBgColor, padding: 20, borderRadius: 16, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ width: '55Not %' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Manrope_300Light', color: cardTextColor }}>{item[1]}</Text>
                    <Text style={{ fontSize: 20, fontFamily: 'Manrope_500Medium', color: cardTextColor }}>{item[2]?.toTitleCase()}</Text>
                  </View>
                  <View style={{ width: '20%' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Manrope_300Light', color: cardTextColor }}>Credit</Text>
                    <Text style={{ fontSize: 22, fontFamily: 'Manrope_600SemiBold', color: cardTextColor }}>{item[3]}</Text>
                  </View>
                  <View style={{ width: '20%' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Manrope_300Light', color: cardTextColor }}>Grade</Text>
                    <Text style={{ fontSize: 22, fontFamily: 'Manrope_600SemiBold', color: cardTextColor }}>{item[4] === 'Completed' ? 'Cmp' : item[4]}</Text>
                  </View>
                </View>
              ))}
              <View style={{ backgroundColor: 'steelblue', padding: 20, borderRadius: 16, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <Text style={{ fontSize: 24, fontFamily: 'Manrope_300Light', color: 'white' }}>GPA</Text>
                <Text style={{ fontSize: 28, fontFamily: 'Manrope_700Bold', color: 'white' }}>{gpa}</Text>
              </View>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 150,
  },
});
