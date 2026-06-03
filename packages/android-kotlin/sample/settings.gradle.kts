pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
    plugins {
        id("com.android.application") version "8.5.0"
        id("org.jetbrains.kotlin.android") version "1.9.24"
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPO)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "cinacoin-sample"
include(":app")
includeBuild("../") {
    dependencySubstitution {
        substitute(module("com.cinacoin:sdk-android")).using(project(":"))
    }
}
