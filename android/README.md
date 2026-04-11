# Iterum Line Log — Android (Capacitor)

## Open in Android Studio

1. From the **repo root** (parent of this folder), sync web assets when you change `public/` or `capacitor.config.json`:
   ```bash
   npm run cap:sync
   ```
2. In **Android Studio**: **File → Open** → choose this **`android`** folder (not the repo root).
3. Wait for Gradle sync. If the SDK is missing, install **SDK Platform 35** and **Build-Tools 34+** when prompted.
4. Run the app: select the **app** configuration → green **Run** (device or emulator).

## JDK

`gradle.properties` sets `org.gradle.java.home` to **Android Studio’s bundled JDK 21** (`…/Android Studio/jbr`).  
If Android Studio is installed elsewhere, update that path or remove the line and set **Gradle JDK** in Android Studio: **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK**.

Do **not** use Java 25+ on the command line for Gradle yet; AGP will error with “Unsupported class file major version”.

## `local.properties` (SDK path)

Android Studio usually creates `local.properties` with `sdk.dir=…`. If Gradle says it can’t find the SDK, copy `local.properties.example` to `local.properties` and set `sdk.dir` to your Android SDK (often `%LOCALAPPDATA%\Android\Sdk` on Windows).

## Release (Play Store)

**Build → Generate Signed App Bundle / APK**, use your upload key, then upload the **.aab** in Play Console.

## Debug APK location

After `.\gradlew.bat assembleDebug`:

`app/build/outputs/apk/debug/app-debug.apk`
