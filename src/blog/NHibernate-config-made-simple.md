---
title: NHibernate config made simple
date: "2006-07-20"
description: >-
  A basic NHibernate configuration, grab it and make it yours
---

So, I use NHibernate a lot. I've found the following approach for NHibernate configs in my .config file to be especially useful:

```xml
<configuration> 
   <configSections> 
      <section name="hibernate-configuration"
            type="NHibernate.Cfg.ConfigurationSectionHandler, 
                  NHibernate" /> 
   </configSections> 

   <hibernate-configuration xmlns="urn:nhibernate-configuration-2.0"> 
      <session-factory> 
         <property name="hibernate.dialect">
              NHibernate.Dialect.MsSql2000Dialect
         </property> 
         <property name="hibernate.connection.provider">
              NHibernate.Connection.DriverConnectionProvider
         </property> 
         <property name="hibernate.connection.connection_string">
             {ConnectionString}
         </property> 
         <property name="hibernate.show_sql">
             true
         </property> 
         <property name="hibernate.connection.driver_class">
             NHibernate.Driver.SqlClientDriver
         </property> 
         <property name="hibernate.connection.isolation">
             ReadCommitted
         </property> 
         <property name="hibernate.use_proxy_validator">
             True
         </property> 

         <mapping assembly="mobyProject" /> 
      </session-factory> 
   </hibernate-configuration> 
</configuration>
```

Basically, I use the NHibernate config section handler to initialize NHibernate's session factory config values and to specify which assembly contains my mappings (using <mapping assembly="mobyProject" />). Since I keep all of my business objects and mapping files in one directory, this is especially helpful.

As you probably know, not all of the config settings above are needed, but I like to document ones I might want to change later, even if they're just set to the default now... it helps jog a tired brain now and then.

Configuring your Session Factory is an extremely simple call then as well:

```csharp
sessionFactory = new Configuration().Configure().BuildSessionFactory();
```