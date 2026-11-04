plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "de.duve.claudeauto"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.duve.claudeauto"
        minSdk = 29
        targetSdk = 34
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "0.1." + (System.getenv("GITHUB_RUN_NUMBER") ?: "0")
    }

    signingConfigs {
        create("fest") {
            // Fester Schlüssel aus den GitHub-Secrets, damit Updates sich über die alte Version installieren lassen
            val ks = System.getenv("AUTO_KEYSTORE_PATH")
            if (ks != null) {
                storeFile = file(ks)
                storePassword = System.getenv("AUTO_KEYSTORE_PASSWORD")
                keyAlias = "claudeauto"
                keyPassword = System.getenv("AUTO_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (System.getenv("AUTO_KEYSTORE_PATH") != null)
                signingConfigs.getByName("fest") else signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.car.app:app:1.7.0")
    implementation("androidx.core:core-ktx:1.13.1")
}
